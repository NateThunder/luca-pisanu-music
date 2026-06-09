import Image from "next/image";
import Link from "next/link";
import { LessonPortrait } from "@/components/LessonPortrait";
import { ReleaseList } from "@/components/ReleaseList";
import { Reveal } from "@/components/Reveal";
import { VideoPreview } from "@/components/VideoPreview";
import { ActionLink, Arrow, Barcode, Crosshair } from "@/components/ui";
import { heroLines, lessonFeatures, releases, roles, videos } from "@/data/site";

export default function HomePage() {
  return (
    <>
      <section className="home-hero poster-section">
        <div className="home-hero__copy">
          <h1 className="home-headline">
            {heroLines.map((line, index) => (
              <span
                className={`hero-stagger hero-stagger--${index + 2}`}
                key={line}
              >
                {line}
              </span>
            ))}
        </h1>
          <p className="home-hero__intro hero-stagger hero-stagger--six">
            Expressive songs, deep grooves and honest production shaped across
            guitar, bass and everything around them.
          </p>
          <div className="hero-actions hero-stagger hero-stagger--six">
            <ActionLink href="/music" variant="primary">
              Listen Now <Arrow />
            </ActionLink>
            <ActionLink href="/lessons">Guitar Lessons</ActionLink>
            <ActionLink href="/contact?type=music">Book Luca</ActionLink>
          </div>
        </div>

        <div className="home-hero__visual hero-stagger hero-stagger--three">
          <span className="mustard-sun" aria-hidden="true" />
          <div className="home-hero__photo">
            <Image
              src="/luca-sitting.png"
              alt="Luca Pisanu seated with guitar"
              fill
              preload
              sizes="(max-width: 820px) 100vw, 52vw"
              className="home-hero__photo-image"
            />
          </div>
          <span className="brush-slash" aria-hidden="true" />
        </div>

        <Crosshair className="hero-crosshair" />
        <span className="roundel" aria-hidden="true">
          songs · stories · sound ·
        </span>
      </section>

      <Reveal>
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
          <div className="side-ticket" aria-hidden="true">
            <span>New drop</span>
            <strong>Live your sound.</strong>
            <Barcode />
          </div>
        </section>
      </Reveal>

        <Reveal>
        <section className="home-video poster-section">
          <h2>Live &amp; In The Moment</h2>
          <VideoPreview video={videos[0]} featured />
          <ActionLink href="/videos">
            View all videos <Arrow />
          </ActionLink>
        </section>
      </Reveal>

      <div className="home-split">
        <Reveal>
          <section className="home-feature home-feature--about poster-section">
            <h2>
              More Than
              <br />
              <span className="circled-word">Just</span> Guitar.
            </h2>
            <p>
              A songwriter, composer and producer with a multi-instrumental
              approach to melody, rhythm and arrangement.
            </p>
            <div className="role-strip">
              {roles.map((role) => (
                <span key={role.title}>{role.title}</span>
              ))}
            </div>
            <ActionLink href="/about">
              Read the story <Arrow />
            </ActionLink>
            <div className="about-ticket" aria-hidden="true">
              <span>Creative work</span>
              <strong>Without neat edges.</strong>
              <Barcode />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="home-contact poster-section">
            <h2>Let&apos;s Connect</h2>
            <p>
              For music, lessons, collaborations or a conversation about a new
              idea.
            </p>
            <ActionLink href="/contact" variant="dark">
              Send a message <Arrow />
            </ActionLink>
            <Crosshair className="home-contact__crosshair" />
          </section>
        </Reveal>
      </div>

      <div className="home-split home-split--final">
        <Reveal>
          <section className="home-feature poster-section home-feature--lessons">
            <h2>Guitar Lessons</h2>
            <p className="eyebrow">Learn. Play. Express.</p>
            <p>
              Move beyond shapes and into sound, feel and expression through
              one-to-one sessions built around your musical voice.
            </p>
            <div className="mini-feature-list">
              {lessonFeatures.map((feature, index) => (
                <div key={feature.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                  </div>
                </div>
              ))}
            </div>
            <ActionLink href="/lessons">
              Explore lessons <Arrow />
            </ActionLink>
            <LessonPortrait
              alt="Luca Pisanu smiling"
              className="home-feature__photo"
              sizes="(max-width: 820px) 52vw, (max-width: 1100px) 47vw, 34vw"
            />
          </section>
        </Reveal>
      </div>
    </>
  );
}
