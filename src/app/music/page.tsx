import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ReleaseArtwork } from "@/components/ReleaseArtwork";
import { ReleaseList } from "@/components/ReleaseList";
import { Reveal } from "@/components/Reveal";
import { ActionLink, Arrow, Barcode } from "@/components/ui";
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
      <PageHero
        eyebrow="The recordings"
        title={
          <>
            Songs Made
            <br />
            To <span className="outline-text">Move.</span>
          </>
        }
        accent="Soul in the grain."
        copy="Independent music built from melody, texture and the spaces between the notes."
        actions={
          <ActionLink href={featured.listenUrl} variant="primary">
            Listen to the latest <Arrow />
          </ActionLink>
        }
        className="music-hero"
        visual={
          <div className="music-hero-art">
            <ReleaseArtwork release={featured} showPlay={false} />
            <span className="music-hero-art__stamp">LP / AUDIO / 01</span>
          </div>
        }
      />

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
          <div className="featured-release__ticket" aria-hidden="true">
            <strong>Independent release</strong>
            <span>Written · played · produced</span>
            <Barcode />
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

      <Reveal>
        <section className="page-cta page-cta--paper poster-section">
          <span className="handwritten">More on the way.</span>
          <h2>Follow The Next Sound.</h2>
          <p>
            Streaming and support destinations will appear here as releases go
            live.
          </p>
          <ActionLink href="/contact?type=music" variant="dark">
            Music & booking enquiries <Arrow />
          </ActionLink>
        </section>
      </Reveal>
    </>
  );
}
