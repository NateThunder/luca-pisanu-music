import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { ActionLink, Arrow, Barcode } from "@/components/ui";
import { liveGigs } from "@/data/site";

export const metadata: Metadata = {
  title: "Live",
  description:
    "Live gig dates, booking information and performance updates from Luca Pisanu.",
};

export default function LivePage() {
  return (
    <>
      <section className="live-hero poster-section">
        <div className="live-hero__image" aria-hidden="true">
          <Image
            src="/luca-guitar-live.png"
            alt=""
            fill
            preload
            sizes="100vw"
            className="live-hero__photo"
          />
        </div>
        <div className="live-hero__content">
          <span className="eyebrow">Live gigs</span>
          <h1>Live</h1>
          <p>
            Stage dates, festival sets and full-band moments will be listed here
            as soon as they are announced.
          </p>
          <div className="hero-actions">
            <ActionLink href="/contact?type=music" variant="primary">
              Book Luca <Arrow />
            </ActionLink>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="live-list poster-section">
          <div className="section-heading">
            <div>
              <h2>Upcoming Dates</h2>
            </div>
            <span className="handwritten">In the room.</span>
          </div>

          {liveGigs.length > 0 ? (
            <div className="live-gig-list">
              {liveGigs.map((gig) => (
                <article
                  className="live-gig"
                  key={`${gig.city}-${gig.date}-${gig.venue}`}
                >
                  <div className="live-gig__date">
                    <span>{gig.city}</span>
                    <strong>{gig.date}</strong>
                  </div>
                  <div className="live-gig__details">
                    <span>{gig.event}</span>
                    <strong>{gig.venue}</strong>
                  </div>
                  <ActionLink
                    href={gig.link}
                    className="live-gig__link"
                    ariaLabel={`${gig.linkLabel} for ${gig.event} at ${gig.venue}`}
                  >
                    {gig.linkLabel}
                  </ActionLink>
                </article>
              ))}
            </div>
          ) : (
            <div className="live-empty">
              <span className="micro-label">Dates coming soon</span>
              <h3>New live dates are being lined up.</h3>
              <p>
                Check back for confirmed shows, or get in touch about booking
                Luca for a live set, session or event.
              </p>
              <ActionLink href="/contact?type=music" variant="primary">
                Booking enquiries <Arrow />
              </ActionLink>
              <Barcode className="live-empty__barcode" />
            </div>
          )}
        </section>
      </Reveal>

      <section className="page-cta page-cta--mustard poster-section">
        <span className="handwritten">For venues, festivals and sessions.</span>
        <h2>Book Luca Live.</h2>
        <p>
          Share the date, location and setup, and Luca will reply directly about
          availability.
        </p>
        <ActionLink href="/contact?type=music" variant="dark">
          Start a booking enquiry <Arrow />
        </ActionLink>
      </section>
    </>
  );
}
