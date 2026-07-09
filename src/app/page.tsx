import Image from "next/image";
import Link from "next/link";
import { HeroComments } from "@/components/HeroComments";
import { LessonPortrait } from "@/components/LessonPortrait";
import { ReleaseList } from "@/components/ReleaseList";
import { VideoPreview } from "@/components/VideoPreview";
import { ActionLink, Arrow, Crosshair } from "@/components/ui";
import { heroLines, heroRoles } from "@/data/site";
import { getMusicReleases } from "@/lib/music-data";
import { getFeaturedWatchVideo } from "@/lib/watch-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [releases, featuredVideo] = await Promise.all([
    getMusicReleases(),
    getFeaturedWatchVideo(),
  ]);

  return (
    <>
      <section className="home-hero poster-section">
        <div className="home-hero__banner" aria-hidden="true">
          <Image
            src="/luca-guitar-live.png"
            alt=""
            fill
            preload
            sizes="100vw"
            className="home-hero__banner-image"
          />
        </div>

        <div className="home-hero__copy">
          <h1 className="home-headline">
            {heroLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="home-hero__roles">
            {heroRoles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </p>
          <div className="hero-actions">
            <ActionLink href="/music" variant="primary">
              Listen Now <Arrow />
            </ActionLink>
            <ActionLink href="/lessons">Guitar Lessons</ActionLink>
            <ActionLink href="/contact?type=music">Book Luca</ActionLink>
          </div>
        </div>

        <HeroComments />
      </section>

      <section className="home-music poster-section">
        <div className="section-heading">
          <div>
            <h2>Music</h2>
          </div>
          <Link className="text-link" href="/music">
            View all music <Arrow />
          </Link>
        </div>
        <ReleaseList items={releases.slice(0, 3)} compact />
      </section>

      <section className="home-video poster-section">
        <div className="home-video__content">
          <h2>Watch</h2>
          <VideoPreview video={featuredVideo} featured />
          <ActionLink href="/videos">
            View all videos <Arrow />
          </ActionLink>
        </div>
      </section>

      <div className="home-split home-split--single">
        <section className="home-contact poster-section">
          <div className="home-contact__copy">
            <h2>Let&apos;s Connect</h2>
            <p>
              For music, lessons, collaborations or a conversation about a new
              idea.
            </p>
            <ActionLink href="/contact" variant="dark">
              Send a message <Arrow />
            </ActionLink>
          </div>
          <LessonPortrait
            alt="Luca Pisanu smiling"
            className="home-contact__portrait"
            sizes="(max-width: 820px) 82vw, (max-width: 1100px) 38vw, 31vw"
          />
          <Crosshair className="home-contact__crosshair" />
        </section>
      </div>
    </>
  );
}
