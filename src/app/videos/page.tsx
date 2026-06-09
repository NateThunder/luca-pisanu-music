import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { Reveal } from "@/components/Reveal";
import { VideoPreview } from "@/components/VideoPreview";
import { ActionLink, Arrow } from "@/components/ui";
import { videos } from "@/data/site";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Live performances, studio moments and lesson previews from Luca Pisanu.",
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
        copy="Performances, studio fragments and teaching moments captured without losing the room around them."
        actions={
          <ActionLink href="#featured-video" variant="primary">
            Watch featured <Arrow />
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
        <section className="featured-video poster-section" id="featured-video">
          <div className="section-heading">
            <div>
              <h2>Featured Session</h2>
            </div>
            <span className="handwritten">Turn it up.</span>
          </div>
          <VideoPreview video={videos[0]} featured />
        </section>
      </Reveal>

      <Reveal>
        <section className="video-gallery poster-section">
          <div className="section-heading">
            <div>
              <h2>More From The Room</h2>
            </div>
            <p>Live work, studio process and practical musical ideas.</p>
          </div>
          <div className="video-grid">
            {videos.slice(1).map((video) => (
              <VideoPreview video={video} key={video.id} />
            ))}
          </div>
        </section>
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
