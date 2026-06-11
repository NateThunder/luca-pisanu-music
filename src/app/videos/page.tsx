import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { Reveal } from "@/components/Reveal";
import { YouTubeVideoBrowser } from "@/components/videos/YouTubeVideoBrowser";
import { ActionLink, Arrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Live performances, studio moments and Shorts from Luca Pisanu.",
};

export default function VideosPage() {
  return (
    <>
      <PageHero
        eyebrow="On screen"
        title={
          <>
            Live. Raw.
            <br />
            In The <span className="outline-text">Moment.</span>
          </>
        }
        accent="Press play. Leave the edges in."
        copy="Performances, studio fragments and Shorts pulled straight from Luca's YouTube channel."
        actions={
          <ActionLink href="#video-browser" variant="primary">
            Watch latest <Arrow />
          </ActionLink>
        }
        className="videos-hero"
        visual={
          <div className="video-hero-stack">
            <PhotoPlaceholder slot="hat" label="Luca performance portrait" />
            <PhotoPlaceholder
              slot="standing"
              label="Luca standing portrait"
            />
          </div>
        }
      />

      <Reveal>
        <YouTubeVideoBrowser />
      </Reveal>

      <section className="page-cta page-cta--mustard poster-section">
        <span className="handwritten">A new frame soon.</span>
        <h2>Make Something Together.</h2>
        <p>For live work, sessions, films or musical collaborations.</p>
        <ActionLink href="/contact?type=collaboration" variant="dark">
          Start a conversation <Arrow />
        </ActionLink>
      </section>
    </>
  );
}
