import type { Release } from "@/data/site";
import { ReleaseArtwork } from "./ReleaseArtwork";
import { ActionLink } from "./ui";

export function ReleaseList({
  items,
  compact = false,
}: {
  items: Release[];
  compact?: boolean;
}) {
  return (
    <div className={`release-grid ${compact ? "release-grid--compact" : ""}`}>
      {items.map((release, index) => (
        <article className="release-item" key={release.id}>
          <ReleaseArtwork release={release} />
          <div className="release-item__body">
            <span className="micro-label">LP / 0{index + 1}</span>
            <h3>{release.title}</h3>
            <p>{release.description}</p>
            <div className="release-item__links">
              <ActionLink href={release.listenUrl} variant="text">
                Listen
              </ActionLink>
              <span aria-hidden="true">•</span>
              <ActionLink href={release.supportUrl} variant="text">
                Buy / Support
              </ActionLink>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

