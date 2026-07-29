"use client";

import Image from "next/image";
import Link from "next/link";
import type { Release } from "@/data/site";
import { PlayIcon } from "./ui";

export function ReleaseArtwork({
  isPlaying = false,
  onPlay,
  playHref,
  release,
}: {
  isPlaying?: boolean;
  onPlay?: () => void;
  playHref?: string;
  release: Release;
}) {
  const playable = Boolean(release.audioUrl);
  const interactive = playable && Boolean(onPlay || playHref);
  const className = `release-art release-art--${release.artwork}${
    interactive ? " release-art--interactive" : ""
  }`;
  const content = (
    <>
      {release.coverArtUrl && (
        <Image
          className="release-art__image"
          src={release.coverArtUrl}
          alt={release.coverArtAlt || `${release.title} cover artwork`}
          fill
          sizes="(max-width: 760px) 100vw, 25vw"
          unoptimized
        />
      )}
      <span className="release-art__texture" />
      <span className="release-art__shape release-art__shape--one" />
      <span className="release-art__shape release-art__shape--two" />
      <span className="release-art__shape release-art__shape--three" />
      {interactive ? (
        <span className={`play-button${isPlaying ? " is-playing" : ""}`} aria-hidden="true">
          {isPlaying ? <span className="play-button__pause" /> : <PlayIcon />}
        </span>
      ) : null}
    </>
  );

  if (playable && onPlay) {
    return (
      <button
        aria-label={`${isPlaying ? "Pause" : "Play"} ${release.title}`}
        className={className}
        onClick={onPlay}
        type="button"
      >
        {content}
      </button>
    );
  }

  if (playable && playHref) {
    return (
      <Link aria-label={`Open ${release.title} in the music player`} className={className} href={playHref}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
