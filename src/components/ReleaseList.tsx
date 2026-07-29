"use client";

import type { Release } from "@/data/site";
import { useRouter } from "next/navigation";
import { startReleasePlayback } from "@/lib/music-audio";
import { ReleaseArtwork } from "./ReleaseArtwork";
import { ActionLink } from "./ui";
import { SupportTrackButton } from "./shop/SupportTrackButton";

const streamingPlatforms: Array<
  [keyof NonNullable<Release["streamingLinks"]>, string]
> = [
  ["spotify", "Spotify"],
  ["appleMusic", "Apple Music"],
  ["tidal", "Tidal"],
  ["youtube", "YouTube"],
  ["soundcloud", "SoundCloud"],
  ["bandcamp", "Bandcamp"],
];

function StreamingIcon({ platform }: { platform: keyof NonNullable<Release["streamingLinks"]> }) {
  switch (platform) {
    case "spotify":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm4.47 14.08a.7.7 0 0 1-.96.23c-2.63-1.6-5.94-1.96-9.84-1.07a.7.7 0 0 1-.31-1.37c4.27-.98 7.94-.56 10.88 1.24.33.2.43.63.23.97Zm1.2-2.66a.87.87 0 0 1-1.2.29c-3-1.84-7.57-2.37-11.12-1.3a.88.88 0 0 1-.51-1.68c4.06-1.23 9.1-.64 12.54 1.46.42.26.55.81.29 1.23Zm.1-2.78C14.17 8.75 8.24 8.55 4.8 9.6a1.04 1.04 0 1 1-.61-1.99c3.95-1.2 10.49-.97 14.65 1.5a1.04 1.04 0 0 1-1.06 1.78Z" fill="currentColor" />
        </svg>
      );
    case "appleMusic":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M16.47 12.47c-.02-2.18 1.78-3.23 1.86-3.28-1.02-1.49-2.6-1.7-3.16-1.72-1.35-.14-2.63.79-3.31.79-.68 0-1.73-.77-2.85-.75-1.46.02-2.8.85-3.56 2.16-1.52 2.64-.39 6.54 1.1 8.68.72 1.05 1.59 2.24 2.73 2.19 1.09-.04 1.5-.71 2.82-.71 1.31 0 1.68.71 2.83.69 1.17-.02 1.91-1.07 2.63-2.13.83-1.21 1.17-2.39 1.19-2.45-.03-.01-2.26-.87-2.28-3.47ZM14.29 6.05c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.91 2.68.96.08 1.94-.49 2.55-1.23Z" fill="currentColor" />
        </svg>
      );
    case "tidal":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m3 8 3-3 3 3-3 3-3-3Zm6 0 3-3 3 3-3 3-3-3Zm6 0 3-3 3 3-3 3-3-3Zm-6 6 3-3 3 3-3 3-3-3Zm3 3 3-3 3 3-3 3-3-3Z" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M21.55 7.2a2.48 2.48 0 0 0-1.74-1.75C18.28 5.04 12 5.04 12 5.04s-6.28 0-7.81.41A2.48 2.48 0 0 0 2.45 7.2 25.8 25.8 0 0 0 2.04 12c0 1.68.13 3.32.41 4.8a2.48 2.48 0 0 0 1.74 1.75c1.53.41 7.81.41 7.81.41s6.28 0 7.81-.41a2.48 2.48 0 0 0 1.74-1.75c.28-1.48.41-3.12.41-4.8 0-1.68-.13-3.32-.41-4.8ZM10 14.95v-5.9L15.2 12 10 14.95Z" fill="currentColor" />
        </svg>
      );
    case "soundcloud":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M1.5 13.4c-.28 0-.5.22-.55.54L.5 16.1l.45 2.1c.05.32.27.55.55.55.27 0 .49-.23.54-.55l.53-2.1-.53-2.16c-.05-.32-.27-.54-.54-.54Zm2.25-2.05c-.34 0-.6.27-.65.65l-.45 4.1.45 4c.05.38.31.65.65.65s.6-.27.65-.65l.51-4-.51-4.1c-.05-.38-.31-.65-.65-.65Zm2.38-1.82c-.4 0-.72.32-.76.76l-.38 3.81.38 6c.04.44.36.76.76.76.39 0 .71-.32.76-.76l.43-6-.43-3.81c-.05-.44-.37-.76-.76-.76Zm10.08 3.05a4.13 4.13 0 0 0-1.55.3 5.72 5.72 0 0 0-5.58-4.45c-.53 0-.72.1-.72.1-.29.12-.37.25-.37.49v10.8c0 .25.19.45.43.48h7.79a3.86 3.86 0 1 0 0-7.72Z" fill="currentColor" />
        </svg>
      );
    case "bandcamp":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7.15 5.1H24l-7.15 13.8H0L7.15 5.1Z" fill="currentColor" />
        </svg>
      );
  }
}

export function ReleaseList({
  activeReleaseId,
  items,
  compact = false,
  openPlayerPage = false,
  onPlay,
  onSelect,
}: {
  activeReleaseId?: string | null;
  items: Release[];
  compact?: boolean;
  openPlayerPage?: boolean;
  onPlay?: (release: Release) => void;
  onSelect?: (release: Release) => void;
}) {
  const router = useRouter();

  function playOrOpen(release: Release) {
    if (onPlay) {
      onPlay(release);
      return;
    }

    if ((!compact && !openPlayerPage) || !release.audioUrl) return;
    void startReleasePlayback(release).catch(() => undefined);
    router.push(`/music?play=${encodeURIComponent(release.id)}`);
  }

  return (
    <div className={`release-grid ${compact ? "release-grid--compact" : ""}`}>
      {items.map((release, index) => (
        <article className={`release-item${release.isAvailable === false ? " release-item--unavailable" : ""}`} key={release.id} onClick={() => onSelect?.(release)}>
          <ReleaseArtwork
            isPlaying={activeReleaseId === release.id}
            onPlay={release.isAvailable !== false && release.audioUrl && (onPlay || compact || openPlayerPage) ? () => playOrOpen(release) : undefined}
            release={release}
          />
          <div className="release-item__body">
            <span className="micro-label">{release.releaseType ?? "SINGLE"} / 0{index + 1}</span>
            <h3>{release.title}</h3>
            <p>{release.description}</p>
            {release.isAvailable === false ? <span className="music-coming-soon">Coming soon</span> : compact ? (
              <div className="release-item__links">
                {release.audioUrl && (onPlay || compact) ? (
                  <button className="action-link action-link--text" onClick={() => playOrOpen(release)} type="button">
                    Listen
                  </button>
                ) : null}
                {release.isForSale && release.purchaseProductId && release.purchasePrices
                  ? <SupportTrackButton compact productId={release.purchaseProductId} title={release.title} prices={release.purchasePrices} />
                  : <span className="music-coming-soon">Coming soon</span>}
                <StreamingLinks release={release} />
              </div>
            ) : (
              <div className="release-item__details">
                {release.isForSale && release.purchaseProductId && release.purchasePrices
                  ? <SupportTrackButton productId={release.purchaseProductId} title={release.title} prices={release.purchasePrices} />
                  : <span className="music-coming-soon">Coming soon</span>}
                <div className="release-item__listen-row">
                  {release.audioUrl && (onPlay || openPlayerPage) ? (
                    <button className="action-link action-link--text" onClick={() => playOrOpen(release)} type="button">
                      Listen
                    </button>
                  ) : null}
                  <StreamingLinks release={release} />
                </div>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function StreamingLinks({ release }: { release: Release }) {
  return (
    <span aria-label="Listen on streaming platforms" className="release-item__streaming-links">
      {streamingPlatforms.map(([key, label]) => {
        const href = release.streamingLinks?.[key];
        if (!href) return null;

        return (
          <ActionLink
            ariaLabel={`Listen on ${label}`}
            className="streaming-link"
            href={href}
            key={key}
            title={label}
            variant="text"
          >
            <StreamingIcon platform={key} />
          </ActionLink>
        );
      })}
    </span>
  );
}
