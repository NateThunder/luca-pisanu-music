import { requireAdmin } from "@/lib/admin-auth";
import {
  booleanValue,
  idFromRequestUrl,
  jsonError,
  jsonOk,
  nullableUrl,
  numberValue,
  readJson,
  slugify,
  text,
  type FieldErrors,
} from "@/lib/admin-route-utils";
import {
  getLiveGigsDatabase,
  rowToAdminLiveGig,
  type LiveGigRow,
} from "@/lib/live-data";

export const dynamic = "force-dynamic";

type LiveGigBody = {
  id?: unknown;
  event?: unknown;
  venue?: unknown;
  location?: unknown;
  startsDate?: unknown;
  startsTime?: unknown;
  timezone?: unknown;
  ticketUrl?: unknown;
  sortOrder?: unknown;
  isVisible?: unknown;
};

type PatchBody = {
  action?: "visibility" | "reorder";
  id?: unknown;
  ids?: unknown;
  isVisible?: unknown;
};

const columns = `id,
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
  updated_at`;

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

async function fetchLiveGig(db: D1Database, id: string) {
  return await db
    .prepare(`SELECT ${columns} FROM live_gigs WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<LiveGigRow>();
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getLiveGigsDatabase();
  if (!db) return jsonError("Live gigs database is not configured.", 503);

  const result = await db
    .prepare(
      `SELECT ${columns}
       FROM live_gigs
       ORDER BY sort_order ASC, starts_date ASC, starts_time ASC`,
    )
    .all<LiveGigRow>();

  return jsonOk({
    gigs: (result.results ?? []).map(rowToAdminLiveGig),
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await readJson<LiveGigBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  const errors: FieldErrors = {};
  const event = text(body.event);
  const venue = text(body.venue);
  const location = text(body.location);
  const startsDate = text(body.startsDate);
  const startsTime = text(body.startsTime);
  const timezone = text(body.timezone) || "Europe/London";
  const id = slugify(text(body.id) || `${event}-${startsDate}`);
  const ticketUrl = nullableUrl(body.ticketUrl, errors, "ticketUrl");
  const sortOrder = numberValue(body.sortOrder, 100);
  const isVisible = booleanValue(body.isVisible, true);

  if (!id) errors.id = "Enter an id or event.";
  if (!event) errors.event = "Event is required.";
  if (!venue) errors.venue = "Venue is required.";
  if (!location) errors.location = "Location is required.";
  if (!isDate(startsDate)) errors.startsDate = "Enter a date in YYYY-MM-DD format.";
  if (!isTime(startsTime)) errors.startsTime = "Enter a time in HH:MM format.";
  if (!isTimeZone(timezone)) errors.timezone = "Enter a valid timezone.";

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  const db = await getLiveGigsDatabase();
  if (!db) return jsonError("Live gigs database is not configured.", 503);

  await db
    .prepare(
      `INSERT INTO live_gigs (
        id,
        event,
        venue,
        location,
        starts_date,
        starts_time,
        timezone,
        ticket_url,
        sort_order,
        is_visible,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        event = excluded.event,
        venue = excluded.venue,
        location = excluded.location,
        starts_date = excluded.starts_date,
        starts_time = excluded.starts_time,
        timezone = excluded.timezone,
        ticket_url = excluded.ticket_url,
        sort_order = excluded.sort_order,
        is_visible = excluded.is_visible,
        updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      event,
      venue,
      location,
      startsDate,
      startsTime,
      timezone,
      ticketUrl,
      sortOrder,
      isVisible ? 1 : 0,
      new Date().toISOString(),
    )
    .run();

  const gig = await fetchLiveGig(db, id);
  return jsonOk({ gig: gig ? rowToAdminLiveGig(gig) : null });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getLiveGigsDatabase();
  if (!db) return jsonError("Live gigs database is not configured.", 503);

  const body = await readJson<PatchBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  if (body.action === "reorder") {
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
    if (!ids.length) return jsonError("Gig ids are required.", 422);

    await db.batch(
      ids.map((id, index) =>
        db
          .prepare(`UPDATE live_gigs SET sort_order = ?, updated_at = ? WHERE id = ?`)
          .bind((index + 1) * 10, new Date().toISOString(), id),
      ),
    );

    return jsonOk({ ids });
  }

  if (body.action === "visibility") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return jsonError("Gig id is required.", 422, { id: "Required." });

    const isVisible = booleanValue(body.isVisible, false);
    await db
      .prepare(`UPDATE live_gigs SET is_visible = ?, updated_at = ? WHERE id = ?`)
      .bind(isVisible ? 1 : 0, new Date().toISOString(), id)
      .run();

    return jsonOk({ id, isVisible });
  }

  return jsonError("Unsupported action.", 400);
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getLiveGigsDatabase();
  if (!db) return jsonError("Live gigs database is not configured.", 503);

  const body = await readJson<{ id?: unknown }>(request);
  const bodyId = typeof body?.id === "string" ? body.id.trim() : "";
  const id = bodyId || idFromRequestUrl(request);
  if (!id) return jsonError("Gig id is required.", 422, { id: "Required." });

  await db.prepare(`DELETE FROM live_gigs WHERE id = ?`).bind(id).run();

  return jsonOk({ id });
}
