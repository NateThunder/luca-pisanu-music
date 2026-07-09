import type { Metadata } from "next";
import { ActionLink, Arrow } from "@/components/ui";
import { getLiveGigs } from "@/lib/live-data";

export const metadata: Metadata = {
  title: "Gigs",
  description:
    "Live gig dates, booking information and performance updates from Luca Pisanu.",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const liveGigs = await getLiveGigs();

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
                key={gig.id}
              >
                <div className="live-gig__date">
                  <span>{gig.location}</span>
                  <strong>{gig.dateLabel}</strong>
                </div>
                <div className="live-gig__details">
                  <span>{gig.event}</span>
                  <strong>{gig.venue}</strong>
                </div>
                {gig.ticketUrl ? (
                  <ActionLink
                    href={gig.ticketUrl}
                    className="live-gig__link"
                    ariaLabel={`Tickets for ${gig.event} at ${gig.venue}`}
                  >
                    Tickets
                  </ActionLink>
                ) : null}
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
