import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { Reveal } from "@/components/Reveal";
import { ActionLink, Arrow, Barcode } from "@/components/ui";
import { roles } from "@/data/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story and creative practice of singer-songwriter, composer, producer and multi-instrumentalist Luca Pisanu.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The artist"
        title={
          <>
            One Voice.
            <br />
            Many <span className="circled-word">Instruments.</span>
          </>
        }
        accent="Always chasing the honest take."
        copy="Luca Pisanu is a singer-songwriter, composer, producer and multi-instrumentalist working where songs, groove and texture meet."
        actions={
          <ActionLink href="/music" variant="primary">
            Hear the music <Arrow />
          </ActionLink>
        }
        className="about-hero"
        visual={<PhotoPlaceholder slot="bass" label="Luca with bass guitar" />}
      />

      <Reveal>
        <section className="artist-story poster-section">
          <div className="artist-story__title">
            <h2>
              The Song Comes
              <br />
              Before The Category.
            </h2>
          </div>
          <div className="artist-story__copy">
            <p className="lead-copy">
              Luca’s work begins with feel: a lyric that stays, a bass movement,
              a guitar phrase or a rhythm that opens a door.
            </p>
            <p>
              From there, songwriting, composition and production become one
              continuous process. Instruments are chosen for what the song
              needs, not to prove a point. Arrangements keep their human edges,
              performances are allowed to breathe and the final recording
              carries the character of the room it came from.
            </p>
            <p>
              That same approach shapes Luca’s teaching. Technique and theory
              are useful when they lead back to expression, confidence and a
              sound that belongs to the player.
            </p>
          </div>
          <div className="artist-story__ticket" aria-hidden="true">
            <span>Story / sound / rhythm</span>
            <strong>Independent by instinct.</strong>
            <Barcode />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="roles-section poster-section">
          <div className="section-heading">
            <div>
              <h2>The Work</h2>
            </div>
            <span className="handwritten">Different roles. One language.</span>
          </div>
          <div className="roles-grid">
            {roles.map((role, index) => (
              <article key={role.title}>
                <span>0{index + 1}</span>
                <h3>{role.title}</h3>
                <p>{role.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="about-process poster-section">
          <PhotoPlaceholder
            slot="standing"
            label="Luca portrait"
            framed
          />
          <div>
            <h2>Keep The Character.</h2>
            <p>
              The aim is not perfection polished flat. It is clarity with
              character: the small timing choice, the scrape of a string, the
              arrangement decision that makes a lyric land.
            </p>
            <ActionLink href="/contact?type=collaboration">
              Start a collaboration <Arrow />
            </ActionLink>
          </div>
        </section>
      </Reveal>

      <section className="page-cta page-cta--paper poster-section">
        <span className="handwritten">Songs tell it best.</span>
        <h2>Continue With The Music.</h2>
        <ActionLink href="/music" variant="dark">
          Explore releases <Arrow />
        </ActionLink>
      </section>
    </>
  );
}
