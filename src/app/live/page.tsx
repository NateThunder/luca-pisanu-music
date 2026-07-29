import type { Metadata } from "next";
import { ActionLink, Arrow } from "@/components/ui";
import { getLiveGigs, type PublicLiveGig } from "@/lib/live-data";

export const metadata: Metadata = {
  title: "Gigs",
  description:
    "Live gig dates, booking information and performance updates from Luca Pisanu.",
};

export const dynamic = "force-dynamic";

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.2 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 21s6.5-6.6 6.5-12A6.5 6.5 0 0 0 5.5 9C5.5 14.4 12 21 12 21Z" />
      <circle cx="12" cy="9" r="2.1" />
    </svg>
  );
}

function GigContent({ gig }: { gig: PublicLiveGig }) {
  return (
    <>
      <div className="live-gig__calendar" aria-label={`${gig.weekday} ${gig.day} ${gig.monthYear}`}>
        <span>{gig.weekday}</span>
        <strong>{gig.day}</strong>
        <small>{gig.monthYear}</small>
      </div>
      <div className="live-gig__time">
        <ClockIcon />
        <strong>{gig.startsTime}</strong>
      </div>
      <div className="live-gig__event">
        <strong>{gig.event}</strong>
      </div>
      <div className="live-gig__location">
        <PinIcon />
        <div>
          <strong>{gig.venue}</strong>
          <span>{gig.location}</span>
        </div>
      </div>
      <div className="live-gig__actions">
        {gig.lineupLabel ? <span className="live-gig__lineup">{gig.lineupLabel}</span> : null}
        {gig.ticketUrl ? <span className="live-gig__ticket">Tickets <Arrow /></span> : null}
      </div>
    </>
  );
}

function GigRow({ gig }: { gig: PublicLiveGig }) {
  if (gig.ticketUrl) {
    return (
      <a
        className="live-gig live-gig--ticketed"
        href={gig.ticketUrl}
        rel="noopener noreferrer"
        target="_blank"
        aria-label={`Tickets for ${gig.event} at ${gig.venue}`}
      >
        <GigContent gig={gig} />
      </a>
    );
  }

  return (
    <article className="live-gig">
      <GigContent gig={gig} />
    </article>
  );
}

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
        {liveGigs.length === 0 && (
          <p className="live-list__intro">Check back for future gigs.</p>
        )}

        {liveGigs.length > 0 && (
          <>
            <div className="live-gig-list">
              {liveGigs.map((gig) => (
                <GigRow gig={gig} key={gig.id} />
              ))}
            </div>
          </>
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
