import type { Metadata } from "next";
import { ReleaseArtwork } from "@/components/ReleaseArtwork";
import { ReleaseList } from "@/components/ReleaseList";
import { Reveal } from "@/components/Reveal";
import { ActionLink, Arrow } from "@/components/ui";
import { releases } from "@/data/site";

export const metadata: Metadata = {
  title: "Music",
  description:
    "Explore music by Luca Pisanu: soulful songwriting, expressive guitars and deep grooves.",
};

export default function MusicPage() {
  const featured = releases[0];

  return (
    <>
      <Reveal>
        <section className="featured-release poster-section">
          <div className="featured-release__art">
            <ReleaseArtwork release={featured} />
          </div>
          <div className="featured-release__copy">
            <span className="eyebrow">Featured release</span>
            <h2>{featured.title}</h2>
            <p>
              A late-night piece of songwriting with patient guitar, warm
              harmony and room for every phrase to breathe.
            </p>
            <div className="hero-actions">
              <ActionLink href={featured.listenUrl} variant="primary">
                Listen <Arrow />
              </ActionLink>
              <ActionLink href={featured.supportUrl}>Buy / Support</ActionLink>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="catalogue poster-section">
          <div className="section-heading">
            <div>
              <h2>The Catalogue</h2>
            </div>
            <p>Four records. Four corners of the same musical world.</p>
          </div>
          <ReleaseList items={releases} />
        </section>
      </Reveal>

    </>
  );
}
