import type { Metadata } from "next";
import { ActionLink, Arrow } from "@/components/ui";
import { liveGigs } from "@/data/site";

export const metadata: Metadata = {
  title: "Gigs",
  description:
    "Live gig dates, booking information and performance updates from Luca Pisanu.",
};

export default function LivePage() {
  return (
    <>
      <section className="live-list live-list--standalone poster-section">
        <div className="section-heading">
          <div>
            <h1>Gigs</h1>
          </div>
        </div>
        <p className="live-list__intro">Check back for future gigs.</p>

        {liveGigs.length > 0 && (
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
        )}
      </section>

      <section className="page-cta page-cta--mustard live-booking-cta poster-section">
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
