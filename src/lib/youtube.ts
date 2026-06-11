export type YouTubeVideoFormat = "video" | "short";

export type YouTubeVideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  videoUrl: string;
  embedUrl: string;
  format: YouTubeVideoFormat;
};

export type YouTubeVideosResponse = {
  videos: YouTubeVideoItem[];
  nextPageToken: string | null;
};

export type FetchChannelVideosOptions = {
  pageToken?: string;
  maxResults?: number;
};

export type YouTubeErrorCode =
  | "MISSING_YOUTUBE_CONFIG"
  | "YOUTUBE_REQUEST_FAILED"
  | "YOUTUBE_INVALID_RESPONSE";

export class YouTubeApiError extends Error {
  code: YouTubeErrorCode;
  status: number;

  constructor(code: YouTubeErrorCode, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, YouTubeApiError.prototype);
  }
}

type RawThumbnail = {
  url?: string;
};

type RawThumbnails = {
  default?: RawThumbnail;
  medium?: RawThumbnail;
  high?: RawThumbnail;
  standard?: RawThumbnail;
  maxres?: RawThumbnail;
};

type RawChannelResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type RawPlaylistItem = {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: RawThumbnails;
    resourceId?: {
      videoId?: string;
    };
  };
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
};

type RawPlaylistResponse = {
  nextPageToken?: string;
  items?: RawPlaylistItem[];
};

type RawVideoResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
    };
  }>;
};

const DEFAULT_CHANNEL_HANDLE = "@lucapisanumusic";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_WEB_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

function getChannelHandle() {
  const handle = process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || DEFAULT_CHANNEL_HANDLE;
  return handle.startsWith("@") ? handle : `@${handle.replace(/^\/+|\/+$/g, "")}`;
}

function getChannelId() {
  return process.env.YOUTUBE_CHANNEL_ID?.trim() || "";
}

function getUploadsPlaylistId() {
  return process.env.YOUTUBE_UPLOADS_PLAYLIST_ID?.trim() || "";
}

function pickThumbnail(thumbnails?: RawThumbnails): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ""
  );
}

function decodeXml(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, (entity, code: string) => {
    if (code === "amp") return "&";
    if (code === "lt") return "<";
    if (code === "gt") return ">";
    if (code === "quot") return '"';
    if (code === "apos") return "'";

    const isHex = code.toLowerCase().startsWith("#x");
    const parsed = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
    return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
  });
}

function decodeJsonText(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value
      .replace(/\\u0026/g, "&")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .trim();
  }
}

function readTag(block: string, tagName: string): string {
  const match = block.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`));
  return decodeXml(match?.[1] || "").trim();
}

function readAttribute(block: string, tagName: string, attributeName: string): string {
  const match = block.match(new RegExp(`<${tagName}\\b[^>]*\\b${attributeName}="([^"]+)"[^>]*>`));
  return decodeXml(match?.[1] || "").trim();
}

function readAlternateUrl(block: string): string {
  const match = block.match(/<link\b(?=[^>]*\brel="alternate")[^>]*\bhref="([^"]+)"[^>]*>/);
  return decodeXml(match?.[1] || "").trim();
}

function parseIsoDurationSeconds(value: string): number | null {
  const match = value.match(
    /^P(?:(\d+(?:[.,]\d+)?)Y)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)W)?(?:(\d+(?:[.,]\d+)?)D)?(?:T(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)S)?)?$/,
  );

  if (!match) return null;

  const [, years, months, weeks, days, hours, minutes, seconds] = match.map((part) =>
    part ? Number(part.replace(",", ".")) : 0,
  );

  return (
    years * 31536000 +
    months * 2628000 +
    weeks * 604800 +
    days * 86400 +
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}

function inferVideoFormat({
  videoUrl,
  title,
  description,
  duration,
}: {
  videoUrl: string;
  title: string;
  description: string;
  duration?: string;
}): YouTubeVideoFormat {
  const searchableText = `${videoUrl} ${title} ${description}`.toLowerCase();

  if (videoUrl.includes("/shorts/") || /(^|\s)#(?:yt)?shorts?\b/.test(searchableText)) {
    return "short";
  }

  if (duration) {
    const durationSeconds = parseIsoDurationSeconds(duration);
    if (durationSeconds !== null && durationSeconds <= 60) {
      return "short";
    }
  }

  return "video";
}

function buildThumbnailUrl(id: string, format: YouTubeVideoFormat): string {
  if (format === "short") {
    return `https://i.ytimg.com/vi/${id}/frame0.jpg`;
  }

  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function buildVideoUrl(id: string, format: YouTubeVideoFormat): string {
  return format === "short"
    ? `https://www.youtube.com/shorts/${id}`
    : `https://www.youtube.com/watch?v=${id}`;
}

function buildEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

function getUniqueIds(html: string, patterns: RegExp[], maxResults: number): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const id = match[1];
      if (!id || seen.has(id)) continue;

      seen.add(id);
      ids.push(id);

      if (ids.length >= maxResults) return ids;
    }
  }

  return ids;
}

function parsePublicTitle(block: string, fallback: string) {
  const title =
    block.match(/"lockupMetadataViewModel":\{"title":\{"content":"((?:\\.|[^"\\])*)"/)?.[1] ||
    block.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/)?.[1] ||
    block.match(/"title":\{"simpleText":"((?:\\.|[^"\\])*)"/)?.[1] ||
    "";

  return title ? decodeJsonText(title) : fallback;
}

function parsePublicPublishedAt(block: string) {
  const metadataStart = block.indexOf('"lockupMetadataViewModel"');
  const candidate = metadataStart >= 0 ? block.slice(metadataStart) : block;
  const metadataRow = candidate.match(/"metadataRows":\[\{"metadataParts":\[([\s\S]*?)\]\}/)?.[1] || "";
  const metadataValues = Array.from(metadataRow.matchAll(/"content":"((?:\\.|[^"\\])*)"/g)).map(
    (match) => decodeJsonText(match[1]),
  );
  const publishedAt =
    metadataValues.find((value) =>
      /\b(?:second|minute|hour|day|week|month|year)s? ago\b/i.test(value),
    ) ||
    candidate.match(/"publishedTimeText":\{"simpleText":"((?:\\.|[^"\\])*)"/)?.[1] ||
    "";

  return publishedAt ? decodeJsonText(publishedAt) : "";
}

function parseVideoTab(html: string, maxResults: number): YouTubeVideoItem[] {
  const ids = getUniqueIds(html, [/"videoId":"([a-zA-Z0-9_-]{11})"/g], maxResults);

  return ids.map((id) => {
    const index = html.indexOf(`"videoId":"${id}"`);
    const block = html.slice(Math.max(0, index - 1200), index + 12000);
    const format: YouTubeVideoFormat = "video";

    return {
      id,
      title: parsePublicTitle(block, "Untitled video"),
      description: "",
      thumbnailUrl: buildThumbnailUrl(id, format),
      publishedAt: parsePublicPublishedAt(block),
      videoUrl: buildVideoUrl(id, format),
      embedUrl: buildEmbedUrl(id),
      format,
    };
  });
}

function parseShortsTitle(accessibilityText: string): string {
  return accessibilityText
    .replace(/\s+play Short$/i, "")
    .replace(
      /,\s*[\d.,]+\s*(?:K|M|B|thousand|million|billion)?\s*views?\s*(?:-|\u2013|\u2014)?$/i,
      "",
    )
    .trim();
}

function parseShortsTab(html: string, maxResults: number): YouTubeVideoItem[] {
  const ids = getUniqueIds(
    html,
    [
      /"reelWatchEndpoint":\{"videoId":"([a-zA-Z0-9_-]{11})"/g,
      /"webCommandMetadata":\{"url":"\/shorts\/([a-zA-Z0-9_-]{11})"/g,
    ],
    maxResults,
  );

  return ids.map((id) => {
    const index = html.indexOf(`"videoId":"${id}"`);
    const block = html.slice(Math.max(0, index - 3000), index + 3000);
    const accessibilityMatches = Array.from(block.matchAll(/"accessibilityText":"((?:\\.|[^"\\])*)"/g));
    const accessibilityText = decodeJsonText(accessibilityMatches.at(-1)?.[1] || "");
    const title = parseShortsTitle(accessibilityText) || parsePublicTitle(block, "Untitled short");
    const format: YouTubeVideoFormat = "short";

    return {
      id,
      title,
      description: "",
      thumbnailUrl: buildThumbnailUrl(id, format),
      publishedAt: parsePublicPublishedAt(block),
      videoUrl: buildVideoUrl(id, format),
      embedUrl: buildEmbedUrl(id),
      format,
    };
  });
}

async function fetchYouTubeTab(tab: "videos" | "shorts") {
  const handle = getChannelHandle();
  const response = await fetch(`https://www.youtube.com/${handle}/${tab}?ucbcb=1`, {
    headers: YOUTUBE_WEB_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new YouTubeApiError(
      "YOUTUBE_REQUEST_FAILED",
      `Failed to fetch the YouTube ${tab} tab.`,
      502,
    );
  }

  const html = await response.text();
  if (html.includes("consent.youtube.com") || html.includes("ConsentUi")) {
    throw new YouTubeApiError(
      "MISSING_YOUTUBE_CONFIG",
      "YouTube public pages require consent in this environment.",
      503,
    );
  }

  return html;
}

async function fetchChannelVideosFromPublicTabs(maxResults: number): Promise<YouTubeVideosResponse> {
  const [videosResult, shortsResult] = await Promise.allSettled([
    fetchYouTubeTab("videos"),
    fetchYouTubeTab("shorts"),
  ]);

  const videos =
    videosResult.status === "fulfilled" ? parseVideoTab(videosResult.value, maxResults) : [];
  const shorts =
    shortsResult.status === "fulfilled" ? parseShortsTab(shortsResult.value, maxResults) : [];

  const data = [...videos, ...shorts];

  if (!data.length) {
    throw new YouTubeApiError(
      "YOUTUBE_INVALID_RESPONSE",
      "The public YouTube page did not include any videos.",
      502,
    );
  }

  return { videos: data, nextPageToken: null };
}

function parseYouTubeFeed(xml: string, maxResults: number): YouTubeVideosResponse {
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g));
  const videos: YouTubeVideoItem[] = entries
    .map((entry) => {
      const block = entry[1];
      const id = readTag(block, "yt:videoId");
      if (!id) return null;

      const title = readTag(block, "media:title") || readTag(block, "title") || "Untitled";
      const description = readTag(block, "media:description");
      const publishedAt = readTag(block, "published");
      const videoUrl = readAlternateUrl(block) || buildVideoUrl(id, "video");
      const format = inferVideoFormat({ videoUrl, title, description });

      return {
        id,
        title,
        description,
        thumbnailUrl: readAttribute(block, "media:thumbnail", "url") || buildThumbnailUrl(id, format),
        publishedAt,
        videoUrl: buildVideoUrl(id, format),
        embedUrl: buildEmbedUrl(id),
        format,
      };
    })
    .filter((video): video is YouTubeVideoItem => Boolean(video))
    .slice(0, maxResults);

  return { videos, nextPageToken: null };
}

async function fetchChannelVideosFromFeed(maxResults: number): Promise<YouTubeVideosResponse> {
  const channelId = getChannelId();

  if (!channelId) {
    throw new YouTubeApiError(
      "MISSING_YOUTUBE_CONFIG",
      "Add YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID to load videos from YouTube.",
      503,
    );
  }

  const params = new URLSearchParams({ channel_id: channelId });
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new YouTubeApiError("YOUTUBE_REQUEST_FAILED", "Failed to fetch the YouTube feed.", 502);
  }

  const data = parseYouTubeFeed(await response.text(), maxResults);
  if (!data.videos.length) {
    throw new YouTubeApiError(
      "YOUTUBE_INVALID_RESPONSE",
      "The YouTube feed did not include any videos.",
      502,
    );
  }

  return data;
}

async function fetchYouTubeApiJson<T>(path: string, params: URLSearchParams): Promise<T> {
  const response = await fetch(`${YOUTUBE_API_BASE}/${path}?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    let message = "Failed to fetch YouTube data.";

    try {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }

    throw new YouTubeApiError("YOUTUBE_REQUEST_FAILED", message, 502);
  }

  return (await response.json()) as T;
}

async function resolveUploadsPlaylistId(apiKey: string): Promise<string> {
  const configuredUploadsPlaylistId = getUploadsPlaylistId();
  if (configuredUploadsPlaylistId) return configuredUploadsPlaylistId;

  const configuredChannelId = getChannelId();
  const params = new URLSearchParams({
    part: "contentDetails",
    key: apiKey,
    maxResults: "1",
  });

  if (configuredChannelId) {
    params.set("id", configuredChannelId);
  } else {
    params.set("forHandle", getChannelHandle());
  }

  const payload = await fetchYouTubeApiJson<RawChannelResponse>("channels", params);
  const uploadsPlaylistId = payload.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new YouTubeApiError(
      "YOUTUBE_INVALID_RESPONSE",
      "YouTube did not return an uploads playlist for this channel.",
      502,
    );
  }

  return uploadsPlaylistId;
}

async function fetchVideoDurations(ids: string[], apiKey: string): Promise<Map<string, string>> {
  if (!ids.length) return new Map();

  const params = new URLSearchParams({
    part: "contentDetails",
    id: ids.join(","),
    key: apiKey,
  });

  try {
    const payload = await fetchYouTubeApiJson<RawVideoResponse>("videos", params);
    return new Map(
      (payload.items || [])
        .filter((item) => item.id && item.contentDetails?.duration)
        .map((item) => [item.id as string, item.contentDetails?.duration as string]),
    );
  } catch {
    return new Map();
  }
}

async function fetchChannelVideosFromApi(
  options: FetchChannelVideosOptions,
  apiKey: string,
): Promise<YouTubeVideosResponse> {
  const maxResults = options.maxResults ?? 24;
  const uploadsPlaylistId = await resolveUploadsPlaylistId(apiKey);
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
    key: apiKey,
  });

  if (options.pageToken) {
    params.set("pageToken", options.pageToken);
  }

  const payload = await fetchYouTubeApiJson<RawPlaylistResponse>("playlistItems", params);

  if (!payload || !Array.isArray(payload.items)) {
    throw new YouTubeApiError(
      "YOUTUBE_INVALID_RESPONSE",
      "YouTube did not return a valid playlist response.",
      502,
    );
  }

  const ids = payload.items
    .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || "")
    .filter(Boolean);
  const durations = await fetchVideoDurations(ids, apiKey);

  const videos = payload.items
    .map((item) => {
      const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      if (!id) return null;

      const title = item.snippet?.title || "Untitled";
      if (title === "Deleted video" || title === "Private video") return null;

      const description = item.snippet?.description || "";
      const duration = durations.get(id);
      const format = inferVideoFormat({
        videoUrl: buildVideoUrl(id, "video"),
        title,
        description,
        duration,
      });

      return {
        id,
        title,
        description,
        thumbnailUrl: pickThumbnail(item.snippet?.thumbnails) || buildThumbnailUrl(id, format),
        publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || "",
        videoUrl: buildVideoUrl(id, format),
        embedUrl: buildEmbedUrl(id),
        format,
      };
    })
    .filter((video): video is YouTubeVideoItem => Boolean(video));

  return {
    videos,
    nextPageToken: payload.nextPageToken || null,
  };
}

export async function fetchChannelVideos(
  options: FetchChannelVideosOptions = {},
): Promise<YouTubeVideosResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const maxResults = options.maxResults ?? 24;

  if (apiKey) {
    return fetchChannelVideosFromApi(options, apiKey);
  }

  if (options.pageToken) {
    throw new YouTubeApiError(
      "MISSING_YOUTUBE_CONFIG",
      "Loading more videos requires YOUTUBE_API_KEY.",
      503,
    );
  }

  try {
    return await fetchChannelVideosFromPublicTabs(maxResults);
  } catch {
    return fetchChannelVideosFromFeed(maxResults);
  }
}
