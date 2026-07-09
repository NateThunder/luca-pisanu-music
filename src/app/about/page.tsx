import type { Metadata } from "next";
import { getAboutPageContent } from "@/lib/about-data";

export const metadata: Metadata = {
  title: "About",
  description:
    "Read the biography of Glasgow-based singer-songwriter, composer, producer and multi-instrumentalist Luca Pisanu.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const about = await getAboutPageContent();

  return (
    <section className="about-bio poster-section">
      <article className="about-bio__content">
        <span className="eyebrow">{about.eyebrow}</span>
        <h1>{about.heading}</h1>
        <blockquote>{about.highlight}</blockquote>

        <div className="about-bio__copy">
          {about.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </section>
  );
}
