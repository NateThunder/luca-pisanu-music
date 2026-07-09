import { getCloudflareContext } from "@opennextjs/cloudflare";
import { videos as fallbackVideos, type Video } from "@/data/site";

export type WatchVideoRow = {
  id: string;
  title: string;
  note: string;
  youtube_url: string;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type AdminWatchVideo = {
  id: string;
  title: string;
  note: string;
  youtubeUrl: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getWatchDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.MUSIC_DB ?? null;
  } catch {
    return null;
  }
}

export function rowToAdminWatchVideo(row: WatchVideoRow): AdminWatchVideo {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    youtubeUrl: row.youtube_url,
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToVideo(row: WatchVideoRow): Video {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    imageSlot: "hat",
    url: row.youtube_url,
    thumbnailUrl: getYouTubeThumbnailUrl(row.youtube_url),
  };
}

function getYouTubeThumbnailUrl(url: string) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function getYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") return parsed.pathname.slice(1) || null;
    if (hostname !== "youtube.com" && hostname !== "youtube-nocookie.com") {
      return null;
    }

    return (
      parsed.searchParams.get("v") ||
      parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1] ||
      parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1] ||
      null
    );
  } catch {
    return null;
  }
}

export function isYouTubeUrl(url: string) {
  return Boolean(getYouTubeVideoId(url));
}

export async function getFeaturedWatchVideo() {
  const db = await getWatchDatabase();
  if (!db) return fallbackVideos[0];

  try {
    const row = await db
      .prepare(
        `SELECT id,
                title,
                note,
                youtube_url,
                sort_order,
                is_visible,
                created_at,
                updated_at
         FROM watch_videos
         WHERE is_visible = 1
         ORDER BY sort_order ASC, title ASC
         LIMIT 1`,
      )
      .first<WatchVideoRow>();

    return row ? rowToVideo(row) : fallbackVideos[0];
  } catch {
    return fallbackVideos[0];
  }
}
