import type { Metadata } from "next";
import Image from "next/image";
import { EpkGallery } from "@/components/epk/EpkGallery";
import { TrioStagePlot } from "@/components/epk/TrioStagePlot";
import { getEpkContent } from "@/lib/epk-data";
import { getMusicReleases } from "@/lib/music-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Electronic Press Kit",
  description: "Luca Pisanu's official electronic press kit: biography, music, press, technical information, photography and booking contact.",
  openGraph: {
    title: "Luca Pisanu - Electronic Press Kit",
    description: "Official biography, music, press, technical information and downloadable media.",
    type: "profile",
  },
};

function DownloadCta({ href }: { href: string }) {
  return (
    <a className="epk2-button epk2-button--accent" download href={href}>
      Download EPK <span aria-hidden="true">↓</span>
    </a>
  );
}

function QuickLinkIcon({ id, label }: { id: string; label: string }) {
  const key = `${id} ${label}`.toLowerCase();

  if (key.includes("instagram")) {
    return (
      <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
        <path d="M7.8 2.75h8.4a5.05 5.05 0 0 1 5.05 5.05v8.4a5.05 5.05 0 0 1-5.05 5.05H7.8a5.05 5.05 0 0 1-5.05-5.05V7.8A5.05 5.05 0 0 1 7.8 2.75Zm0 1.8A3.25 3.25 0 0 0 4.55 7.8v8.4a3.25 3.25 0 0 0 3.25 3.25h8.4a3.25 3.25 0 0 0 3.25-3.25V7.8a3.25 3.25 0 0 0-3.25-3.25H7.8Zm4.2 3.1a4.35 4.35 0 1 1 0 8.7 4.35 4.35 0 0 1 0-8.7Zm0 1.8a2.55 2.55 0 1 0 0 5.1 2.55 2.55 0 0 0 0-5.1Zm4.56-2.61a1.02 1.02 0 1 1 0 2.04 1.02 1.02 0 0 1 0-2.04Z" />
      </svg>
    );
  }

  if (key.includes("tidal")) {
    return (
      <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
        <path d="m4 3 3 3-3 3-3-3 3-3Zm8 0 3 3-3 3-3-3 3-3Zm8 0 3 3-3 3-3-3 3-3Zm-8 8 3 3-3 3-3-3 3-3Z" />
      </svg>
    );
  }

  if (key.includes("apple")) {
    return (
      <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
        <path d="M16.47 12.47c-.02-2.18 1.78-3.23 1.86-3.28-1.02-1.49-2.6-1.7-3.16-1.72-1.35-.14-2.63.79-3.31.79-.68 0-1.73-.77-2.85-.75-1.46.02-2.8.85-3.56 2.16-1.52 2.64-.39 6.54 1.1 8.68.72 1.05 1.59 2.24 2.73 2.19 1.09-.04 1.5-.71 2.82-.71 1.31 0 1.68.71 2.83.69 1.17-.02 1.91-1.07 2.63-2.13.83-1.21 1.17-2.39 1.19-2.45-.03-.01-2.26-.87-2.28-3.47ZM14.29 6.05c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.91 2.68.96.08 1.94-.49 2.55-1.23Z" />
      </svg>
    );
  }

  if (key.includes("youtube") || key.includes("video")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M21.55 7.2a2.48 2.48 0 0 0-1.74-1.75C18.28 5.04 12 5.04 12 5.04s-6.28 0-7.81.41A2.48 2.48 0 0 0 2.45 7.2 25.8 25.8 0 0 0 2.04 12c0 1.68.13 3.32.41 4.8a2.48 2.48 0 0 0 1.74 1.75c1.53.41 7.81.41 7.81.41s6.28 0 7.81-.41a2.48 2.48 0 0 0 1.74-1.75c.28-1.48.41-3.12.41-4.8 0-1.68-.13-3.32-.41-4.8ZM10 14.95v-5.9L15.2 12 10 14.95Z" />
      </svg>
    );
  }

  if (key.includes("music")) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M9.25 4.75v11.1a3.75 3.75 0 1 1-1.5-3V6.1l10-2.1v9.85a3.75 3.75 0 1 1-1.5-3V4.91l-7 1.47v-1.63Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
      <path d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm6.78 8.99h-3.06a15.8 15.8 0 0 0-1.21-5.44 8.28 8.28 0 0 1 4.27 5.44ZM12 4.2c.88 1.08 1.75 3.5 1.96 7.04h-3.92C10.25 7.7 11.12 5.28 12 4.2Zm-2.51 1.6a15.8 15.8 0 0 0-1.21 5.44H5.22A8.28 8.28 0 0 1 9.49 5.8Zm-4.27 6.94h3.06a15.8 15.8 0 0 0 1.21 5.44 8.28 8.28 0 0 1-4.27-5.44ZM12 19.8c-.88-1.08-1.75-3.5-1.96-7.06h3.92c-.21 3.56-1.08 5.98-1.96 7.06Zm2.51-1.62a15.8 15.8 0 0 0 1.21-5.44h3.06a8.28 8.28 0 0 1-4.27 5.44Z" />
    </svg>
  );
}

export default async function EpkPage() {
  const [epk, allReleases] = await Promise.all([getEpkContent(), getMusicReleases()]);
  const publishedReleases = allReleases.filter((release) => release.isAvailable !== false);
  const releaseById = new Map(publishedReleases.map((release) => [release.id, release]));
  const featuredReleases = (
    epk.selectedMusicIds.length
      ? epk.selectedMusicIds.map((id) => releaseById.get(id)).filter((release) => release !== undefined)
      : publishedReleases.slice(0, 5)
  ).slice(0, 5);

  return (
    <article className="epk-page epk-page--compact">
      <section className="epk2-hero">
        <Image
          alt="Luca Pisanu playing guitar live"
          className="epk2-hero__image"
          fill
          priority
          sizes="100vw"
          src={epk.heroImageUrl}
          unoptimized={epk.heroImageUrl.startsWith("/api/")}
        />
        <div className="epk2-hero__shade" />
        <div className="epk2-shell epk2-hero__content">
          <p className="epk2-kicker">{epk.heroEyebrow}</p>
          <h1>EPK</h1>
          <span className="epk2-rule" aria-hidden="true" />
          <p className="epk2-artist">{epk.heroTitle}</p>
          <p className="epk2-roles">{epk.heroSubtitle}</p>
          <div className="epk2-actions">
            <DownloadCta href={epk.pdfDownloadUrl} />
            <a className="epk2-button" href="#epk-book">Book Luca <span aria-hidden="true">→</span></a>
            <a className="epk2-button" href="/music">Listen now <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section className="epk2-biography epk2-section">
        <div className="epk2-biography__portrait epk-reveal">
          <Image
            alt="Portrait of Luca Pisanu"
            fill
            sizes="(max-width: 820px) 100vw, 42vw"
            src={epk.portraitImageUrl}
            unoptimized={epk.portraitImageUrl.startsWith("/api/")}
          />
        </div>
        <div className="epk2-biography__content epk-reveal">
          <h2>Biography</h2>
          <div className="epk2-biography__block">
            <span className="epk2-kicker">Short bio</span>
            <p className="epk2-biography__lead">{epk.shortBio}</p>
          </div>
          <div className="epk2-biography__block">
            <span className="epk2-kicker">Long bio</span>
            <p>{epk.fullBio}</p>
          </div>
        </div>
      </section>

      <section className="epk2-section epk2-quick">
        <div className="epk2-section-intro epk-reveal">
          <span className="epk2-kicker">Quick links</span>
          <h2>{epk.musicHeading}</h2>
          <span className="epk2-rule" aria-hidden="true" />
          <p>{epk.musicIntro}</p>
        </div>
        <div className="epk2-quick__links epk-reveal">
          {epk.links.slice(0, 6).map((link) => (
            <a href={link.url} key={link.id} rel="noreferrer" target="_blank">
              <span className="epk2-quick__icon"><QuickLinkIcon id={link.id} label={link.label} /></span>
              <strong>{link.label}</strong>
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      </section>

      {epk.highlights.length > 0 && (
        <section className="epk2-section epk2-highlights">
          <header className="epk2-highlights__heading epk-reveal">
            <span className="epk2-kicker">Career moments</span>
            <h2>Selected highlights</h2>
            <span className="epk2-rule" aria-hidden="true" />
          </header>
          <ul className="epk2-highlights__list epk-reveal">
            {epk.highlights.map((highlight) => (
              <li key={highlight.id} style={{ gridTemplateColumns: "0.55rem minmax(0, 1fr)" }}>
                <span
                  aria-hidden="true"
                  className="epk2-highlights__bullet"
                  style={{
                    background: "var(--epk2-gold)",
                    borderRadius: "50%",
                    display: "block",
                    height: "0.48rem",
                    width: "0.48rem",
                  }}
                />
                <p>{highlight.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="epk2-section epk2-press">
        <header className="epk2-centered-heading epk-reveal">
          <h2>Press / Reviews</h2>
          <span className="epk2-rule" aria-hidden="true" />
        </header>
        <div className="epk2-press__quotes">
          {epk.quotes.slice(0, 4).map((quote) => (
            <blockquote className="epk-reveal" key={quote.id}>
              <span aria-hidden="true">“</span>
              <p>{quote.quote}</p>
              <cite>
                <a href={quote.url} rel="noreferrer" target="_blank">— {quote.source}</a>
              </cite>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="epk2-section epk2-rider">
        <header className="epk2-section-heading epk-reveal">
          <span className="epk2-kicker">Technical / stage plan</span>
          <h2>{epk.riderHeading}</h2>
          <span className="epk2-rule" aria-hidden="true" />
        </header>
        <div className="epk2-rider__layout epk-reveal">
          <div className="epk2-rider__legend">
            <strong>Trio</strong>
            <span><i className="epk2-line epk2-line--xlr" /> XLR to stage box</span>
            <span><i className="epk2-line epk2-line--signal" /> ¼″ TS instrument</span>
            <span><i className="epk2-line epk2-line--monitor" /> Monitor return</span>
            <span><i className="epk2-dot epk2-dot--gold" /> Vocal / amp mic</span>
            <span><i className="epk2-dot epk2-dot--red" /> Performer</span>
            <span><i className="epk2-dot" /> Clean AC power</span>
          </div>
          <TrioStagePlot />
          <div className="epk2-rider__notes">
            <div><strong>Inputs</strong><p>{epk.riderInputs}</p></div>
            <div><strong>Requirements</strong><p>{epk.riderRequirements}</p></div>
            <div><strong>Advance</strong><p>{epk.riderAdvance}</p></div>
          </div>
        </div>
      </section>

      <section className="epk2-section epk2-music">
        <header className="epk2-section-heading epk-reveal">
          <span className="epk2-kicker">Music</span>
          <h2>Selected releases.</h2>
          <span className="epk2-rule" aria-hidden="true" />
        </header>
        <div className="epk2-music__list epk-reveal">
          {featuredReleases.map((release, index) => (
            <a href={release.audioUrl ? `/music?play=${encodeURIComponent(release.id)}` : "/music"} key={release.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{release.title}</strong>
              <small>Listen →</small>
            </a>
          ))}
        </div>
      </section>

      <section className="epk2-section epk2-gallery">
        <header className="epk2-section-heading epk-reveal">
          <span className="epk2-kicker">Photos</span>
          <h2>Photo gallery</h2>
          <span className="epk2-rule" aria-hidden="true" />
        </header>
        <EpkGallery items={epk.gallery} />
        <p className="epk-gallery__usage">{epk.photoUsageNote}</p>
      </section>

      <section
        className="page-cta page-cta--mustard live-booking-cta epk2-book-strip poster-section"
        id="epk-book"
      >
        <span className="handwritten">Book / press</span>
        <h2>{epk.contactHeading}</h2>
        <p>{epk.contactBody}</p>
        <div className="epk2-book-strip__actions">
          <a className="action-link action-link--dark" href={`mailto:${epk.contactEmail}`}>
            Let&apos;s connect <span aria-hidden="true">→</span>
          </a>
          <a
            className="action-link action-link--dark"
            download
            href={epk.pdfDownloadUrl}
          >
            Download EPK <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
    </article>
  );
}
