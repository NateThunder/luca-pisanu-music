import type { Metadata } from "next";
import { LessonPortrait } from "@/components/LessonPortrait";
import { PageHero } from "@/components/PageHero";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { Reveal } from "@/components/Reveal";
import { ActionLink, Arrow } from "@/components/ui";
import { lessonFaqs, lessonFeatures } from "@/data/site";

export const metadata: Metadata = {
  title: "Guitar Lessons",
  description:
    "One-to-one guitar lessons with Luca Pisanu for players developing sound, feel, theory and expression.",
};

export default function LessonsPage() {
  return (
    <>
      <PageHero
        eyebrow="One-to-one tuition"
        title={
          <>
            Learn The Notes.
            <br />
            Find <span className="outline-text">Your Sound.</span>
          </>
        }
        accent="Learn. Play. Express."
        copy="Personal guitar lessons that connect technique and theory to the music you actually want to make."
        actions={
          <ActionLink href="/contact?type=lessons" variant="primary">
            Enquire about lessons <Arrow />
          </ActionLink>
        }
        className="lessons-hero"
        visual={
          <LessonPortrait
            alt="Luca Pisanu standing and smiling"
            preload
            sizes="(max-width: 980px) 92vw, 42vw"
          />
        }
      />

      <Reveal>
        <section className="teaching-statement poster-section">
          <div>
            <h2>Shapes Are The Start. Music Is The Point.</h2>
          </div>
          <div>
            <p className="lead-copy">
              From heartfelt songs to deep grooves, lessons help you move
              beyond memorised shapes and into sound, feel and expression.
            </p>
            <p>
              Sessions respond to your goals, your influences and how you learn.
              Technique matters, but only when it helps you communicate
              something real.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="lesson-offer poster-section">
          <div className="section-heading">
            <div>
              <h2>What We Can Build</h2>
            </div>
            <span className="handwritten">Your pace. Your voice.</span>
          </div>
          <div className="lesson-feature-grid">
            {lessonFeatures.map((feature, index) => (
              <article key={feature.title}>
                <span className="feature-index">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="lesson-method poster-section">
          <PhotoPlaceholder
            slot="live"
            label="Instrument detail"
            className="lesson-method__photo"
          />
          <div className="lesson-method__copy">
            <h2>Inside A Session</h2>
            <ul>
              <li>Practical technique connected to real songs</li>
              <li>Harmony and theory explained through sound</li>
              <li>Improvisation, phrasing and rhythmic confidence</li>
              <li>Songwriting, arrangement and creative problem-solving</li>
              <li>Clear material to work on between lessons</li>
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="faq-section poster-section">
          <div className="section-heading">
            <div>
              <h2>Before We Start</h2>
            </div>
          </div>
          <div className="faq-list">
            {lessonFaqs.map((item, index) => (
              <details key={item.question}>
                <summary>
                  <span>0{index + 1}</span>
                  {item.question}
                  <i aria-hidden="true">＋</i>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </Reveal>

      <section className="page-cta page-cta--mustard poster-section">
        <span className="handwritten">Ready when you are.</span>
        <h2>Let’s Build Your Sound.</h2>
        <p>Tell Luca where you are now and what you want to play next.</p>
        <ActionLink href="/contact?type=lessons" variant="dark">
          Enquire about lessons <Arrow />
        </ActionLink>
      </section>
    </>
  );
}
