import { getCloudflareContext } from "@opennextjs/cloudflare";
import { liveGigs as fallbackLiveGigs } from "@/data/site";

export type LiveGigRow = {
  id: string;
  event: string;
  venue: string;
  location: string;
  starts_date: string;
  starts_time: string;
  lineup_type: LineupType | null;
  lineup_other: string | null;
  ticket_url: string | null;
  sort_order: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
};

export type LineupType =
  | "SOLO"
  | "DUO"
  | "TRIO"
  | "QUARTET"
  | "FULL_BAND"
  | "OTHER";

export type AdminLiveGig = {
  id: string;
  event: string;
  venue: string;
  location: string;
  startsDate: string;
  startsTime: string;
  lineupType: LineupType | null;
  lineupOther: string | null;
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
  weekday: string;
  day: string;
  monthYear: string;
  startsTime: string;
  lineupLabel: string | null;
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
    lineupType: row.lineup_type,
    lineupOther: row.lineup_other,
    ticketUrl: row.ticket_url,
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatGigDate(dateValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) {
    return { day: dateValue, monthYear: "", weekday: "" };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return { day: dateValue, monthYear: "", weekday: "" };
  }

  return {
    weekday: weekdays[parsed.getUTCDay()],
    day: String(day).padStart(2, "0"),
    monthYear: `${monthNames[month - 1]} ${year}`,
  };
}

function formatLineup(row: LiveGigRow) {
  if (!row.lineup_type) return null;
  if (row.lineup_type === "OTHER") return row.lineup_other?.trim() || null;
  return row.lineup_type === "FULL_BAND"
    ? "Full band"
    : row.lineup_type.charAt(0) + row.lineup_type.slice(1).toLowerCase();
}

function rowToPublicLiveGig(row: LiveGigRow): PublicLiveGig {
  const date = formatGigDate(row.starts_date);
  return {
    id: row.id,
    event: row.event,
    venue: row.venue,
    location: row.location,
    ...date,
    startsTime: row.starts_time,
    lineupLabel: formatLineup(row),
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
      ...formatGigDate(gig.date),
      startsTime: "",
      lineupLabel: null,
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
                lineup_type,
                lineup_other,
                ticket_url,
                sort_order,
                is_visible,
                created_at,
                updated_at
         FROM live_gigs
         WHERE is_visible = 1
           AND starts_date >= date('now')
         ORDER BY sort_order ASC, starts_date ASC, starts_time ASC`,
      )
      .all<LiveGigRow>();

    return (result.results ?? []).map(rowToPublicLiveGig);
  } catch {
    return [];
  }
}
