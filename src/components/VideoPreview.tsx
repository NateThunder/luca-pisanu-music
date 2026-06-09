import type { Video } from "@/data/site";
import { PhotoPlaceholder } from "./PhotoPlaceholder";
import { PlayIcon } from "./ui";

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id
        ? `https://www.youtube-nocookie.com/embed/${id}?rel=0`
        : null;
    }

    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
      const embedId =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1] ||
        parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1];

      return embedId
        ? `https://www.youtube-nocookie.com/embed/${embedId}?rel=0`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function VideoPreview({
  video,
  featured = false,
}: {
  video: Video;
  featured?: boolean;
}) {
  if (!video.url) {
    return (
      <div
        className={`video-preview ${featured ? "video-preview--featured" : ""} is-disabled`}
        aria-disabled="true"
        title="Video coming soon"
      >
        <PhotoPlaceholder
          slot={video.imageSlot}
          label={video.title}
          className="video-preview__image"
        />
        <span className="video-preview__play">
          <PlayIcon />
        </span>
        <span className="video-preview__meta">
          <span>{video.note}</span>
          <strong>{video.title}</strong>
        </span>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(video.url);

  if (embedUrl) {
    return (
      <div
        className={`video-preview video-preview--embed ${featured ? "video-preview--featured" : ""}`}
      >
        <iframe
          className="video-preview__frame"
          src={embedUrl}
          title={video.title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <span className="video-preview__shade" aria-hidden="true" />
        <span className="video-preview__meta video-preview__meta--inline">
          <span>{video.note}</span>
          <strong>{video.title}</strong>
        </span>
      </div>
    );
  }

  return (
    <a
      className={`video-preview ${featured ? "video-preview--featured" : ""}`}
      href={video.url}
      target="_blank"
      rel="noreferrer"
    >
      <PhotoPlaceholder
        slot={video.imageSlot}
        label={video.title}
        className="video-preview__image"
      />
      <span className="video-preview__play">
        <PlayIcon />
      </span>
      <span className="video-preview__meta">
        <span>{video.note}</span>
        <strong>{video.title}</strong>
      </span>
    </a>
  );
}
