import Image from "next/image";
import type { Release } from "@/data/site";
import { PlayIcon } from "./ui";

export function ReleaseArtwork({
  release,
  showPlay = true,
}: {
  release: Release;
  showPlay?: boolean;
}) {
  return (
    <div className={`release-art release-art--${release.artwork}`}>
      {release.coverArtUrl && (
        <Image
          className="release-art__image"
          src={release.coverArtUrl}
          alt=""
          fill
          sizes="(max-width: 760px) 100vw, 25vw"
          unoptimized
        />
      )}
      <span className="release-art__texture" />
      <span className="release-art__shape release-art__shape--one" />
      <span className="release-art__shape release-art__shape--two" />
      <span className="release-art__shape release-art__shape--three" />
      {showPlay && (
        <span className="play-button" aria-hidden="true">
          <PlayIcon />
        </span>
      )}
    </div>
  );
}
