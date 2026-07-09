import { requireAdmin } from "@/lib/admin-auth";
import {
  booleanValue,
  idFromRequestUrl,
  jsonError,
  jsonOk,
  numberValue,
  readJson,
  slugify,
  text,
  type FieldErrors,
} from "@/lib/admin-route-utils";
import {
  getWatchDatabase,
  isYouTubeUrl,
  rowToAdminWatchVideo,
  type WatchVideoRow,
} from "@/lib/watch-data";

export const dynamic = "force-dynamic";

type WatchVideoBody = {
  id?: unknown;
  title?: unknown;
  note?: unknown;
  youtubeUrl?: unknown;
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
  title,
  note,
  youtube_url,
  sort_order,
  is_visible,
  created_at,
  updated_at`;

async function fetchWatchVideo(db: D1Database, id: string) {
  return await db
    .prepare(`SELECT ${columns} FROM watch_videos WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<WatchVideoRow>();
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getWatchDatabase();
  if (!db) return jsonError("Watch video database is not configured.", 503);

  const result = await db
    .prepare(`SELECT ${columns} FROM watch_videos ORDER BY sort_order ASC, title ASC`)
    .all<WatchVideoRow>();

  return jsonOk({
    videos: (result.results ?? []).map(rowToAdminWatchVideo),
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await readJson<WatchVideoBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  const errors: FieldErrors = {};
  const title = text(body.title);
  const note = text(body.note);
  const youtubeUrl = text(body.youtubeUrl);
  const id = slugify(text(body.id) || title);
  const sortOrder = numberValue(body.sortOrder, 100);
  const isVisible = booleanValue(body.isVisible, true);

  if (!id) errors.id = "Enter an id or title.";
  if (!title) errors.title = "Title is required.";
  if (!note) errors.note = "Note is required.";
  if (!youtubeUrl || !isYouTubeUrl(youtubeUrl)) {
    errors.youtubeUrl = "Enter a valid YouTube URL.";
  }

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  const db = await getWatchDatabase();
  if (!db) return jsonError("Watch video database is not configured.", 503);

  await db
    .prepare(
      `INSERT INTO watch_videos (
        id,
        title,
        note,
        youtube_url,
        sort_order,
        is_visible,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        note = excluded.note,
        youtube_url = excluded.youtube_url,
        sort_order = excluded.sort_order,
        is_visible = excluded.is_visible,
        updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      title,
      note,
      youtubeUrl,
      sortOrder,
      isVisible ? 1 : 0,
      new Date().toISOString(),
    )
    .run();

  const video = await fetchWatchVideo(db, id);
  return jsonOk({ video: video ? rowToAdminWatchVideo(video) : null });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getWatchDatabase();
  if (!db) return jsonError("Watch video database is not configured.", 503);

  const body = await readJson<PatchBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  if (body.action === "reorder") {
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
    if (!ids.length) return jsonError("Video ids are required.", 422);

    await db.batch(
      ids.map((id, index) =>
        db
          .prepare(`UPDATE watch_videos SET sort_order = ?, updated_at = ? WHERE id = ?`)
          .bind((index + 1) * 10, new Date().toISOString(), id),
      ),
    );

    return jsonOk({ ids });
  }

  if (body.action === "visibility") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return jsonError("Video id is required.", 422, { id: "Required." });

    const isVisible = booleanValue(body.isVisible, false);
    await db
      .prepare(`UPDATE watch_videos SET is_visible = ?, updated_at = ? WHERE id = ?`)
      .bind(isVisible ? 1 : 0, new Date().toISOString(), id)
      .run();

    return jsonOk({ id, isVisible });
  }

  return jsonError("Unsupported action.", 400);
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getWatchDatabase();
  if (!db) return jsonError("Watch video database is not configured.", 503);

  const body = await readJson<{ id?: unknown }>(request);
  const bodyId = typeof body?.id === "string" ? body.id.trim() : "";
  const id = bodyId || idFromRequestUrl(request);
  if (!id) return jsonError("Video id is required.", 422, { id: "Required." });

  await db.prepare(`DELETE FROM watch_videos WHERE id = ?`).bind(id).run();

  return jsonOk({ id });
}
