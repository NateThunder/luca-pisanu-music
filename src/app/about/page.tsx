import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "Read the biography of Glasgow-based singer-songwriter, composer, producer and multi-instrumentalist Luca Pisanu.",
};

export default function AboutPage() {
  return (
    <section className="about-bio poster-section">
      <article className="about-bio__content">
        <span className="eyebrow">The artist</span>
        <h1>About</h1>
        <blockquote>
          “I’m a dot in the middle of nothing, but in my nothing I can achieve
          everything.”
        </blockquote>

        <div className="about-bio__copy">
          <p>
            Luca Pisanu is a singer-songwriter, composer, producer and
            multi-instrumentalist based in Glasgow, UK.
          </p>
          <p>
            Drawn to music from an early age, he began playing guitar at eight.
            That first instrument set him on a journey through a wide range of
            genres and turned a childhood passion into his life’s focus.
          </p>
          <p>
            Influenced by artists including Stevie Wonder, Stevie Ray Vaughan
            and Jimi Hendrix, Luca creates eclectic, deeply expressive music
            rooted in blues, soul, jazz, funk and neo-soul.
          </p>
          <p>
            After performing with several projects across the UK, Italy and
            France, Luca began exploring his solo career and developing the
            groovy, suave sound that has come to define his work.
          </p>
          <p>
            His wider work has included playing bass for Tom McGuire and the
            Brassholes, guitar for Charlotte Marshall and the 45s, and working
            as an in-demand session musician in Glasgow.
          </p>
          <p>
            Warm vocals, melodic guitars and engaging bass lines make Luca
            Pisanu an artist to watch.
          </p>
        </div>
      </article>

      <figure className="about-bio__portrait">
        <Image
          src="/luca-sitting-cutout.png"
          alt="Luca Pisanu seated beside a guitar"
          fill
          priority
          sizes="(max-width: 820px) 100vw, 62vw"
          className="about-bio__image"
        />
      </figure>
    </section>
  );
}
