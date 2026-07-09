import { getCloudflareContext } from "@opennextjs/cloudflare";
import { liveGigs as fallbackLiveGigs } from "@/data/site";

export type LiveGigRow = {
  id: string;
  event: string;
  venue: string;
  location: string;
  starts_date: string;
  starts_time: string;
  timezone: string;
  ticket_url: string | null;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type AdminLiveGig = {
  id: string;
  event: string;
  venue: string;
  location: string;
  startsDate: string;
  startsTime: string;
  timezone: string;
  ticketUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicLiveGig = {
  id: string;
  event: string;
  venue: string;
  location: string;
  dateLabel: string;
  ticketUrl: string | null;
};

export async function getLiveGigsDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.MUSIC_DB ?? null;
  } catch {
    return null;
  }
}

export function rowToAdminLiveGig(row: LiveGigRow): AdminLiveGig {
  return {
    id: row.id,
    event: row.event,
    venue: row.venue,
    location: row.location,
    startsDate: row.starts_date,
    startsTime: row.starts_time,
    timezone: row.timezone,
    ticketUrl: row.ticket_url,
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatDateLabel(dateValue: string, timeValue: string, timezone: string) {
  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  const dateLabel = Number.isNaN(parsed.getTime())
    ? dateValue
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(parsed);
  const timeLabel = timeValue ? `, ${timeValue}` : "";
  const timezoneLabel = timezone ? ` ${timezone.replace(/_/g, " ")}` : "";

  return `${dateLabel}${timeLabel}${timezoneLabel}`;
}

function rowToPublicLiveGig(row: LiveGigRow): PublicLiveGig {
  return {
    id: row.id,
    event: row.event,
    venue: row.venue,
    location: row.location,
    dateLabel: formatDateLabel(row.starts_date, row.starts_time, row.timezone),
    ticketUrl: row.ticket_url,
  };
}

export async function getLiveGigs() {
  const db = await getLiveGigsDatabase();
  if (!db) {
    return fallbackLiveGigs.map((gig, index) => ({
      id: `${gig.city}-${gig.date}-${index}`,
      event: gig.event,
      venue: gig.venue,
      location: gig.city,
      dateLabel: gig.date,
      ticketUrl: gig.link,
    }));
  }

  try {
    const result = await db
      .prepare(
        `SELECT id,
                event,
                venue,
                location,
                starts_date,
                starts_time,
                timezone,
                ticket_url,
                sort_order,
                is_visible,
                created_at,
                updated_at
         FROM live_gigs
         WHERE is_visible = 1
         ORDER BY sort_order ASC, starts_date ASC, starts_time ASC`,
      )
      .all<LiveGigRow>();

    return (result.results ?? []).map(rowToPublicLiveGig);
  } catch {
    return [];
  }
}
