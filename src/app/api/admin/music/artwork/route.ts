import { requireAdmin } from "@/lib/admin-auth";
import {
  idFromRequestUrl,
  jsonError,
  jsonOk,
  numberValue,
  readJson,
  slugify,
  text,
  type FieldErrors,
} from "@/lib/admin-route-utils";
import { getFile, putImageFile } from "@/lib/file-assets";
import {
  getMusicBucket,
  getMusicDatabase,
  rowToAdminMusicArtwork,
  type MusicArtworkRow,
} from "@/lib/music-data";

export const dynamic = "force-dynamic";

const columns = `id,
  title,
  image_key,
  alt_text,
  sort_order,
  created_at,
  updated_at`;

async function fetchArtwork(db: D1Database, id: string) {
  return await db
    .prepare(`SELECT ${columns} FROM music_artworks WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<MusicArtworkRow>();
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getMusicDatabase();
  if (!db) return jsonError("Music database is not configured.", 503);

  const result = await db
    .prepare(`SELECT ${columns} FROM music_artworks ORDER BY sort_order ASC, title ASC`)
    .all<MusicArtworkRow>();

  return jsonOk({
    artworks: (result.results ?? []).map(rowToAdminMusicArtwork),
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const [db, bucket] = await Promise.all([getMusicDatabase(), getMusicBucket()]);
  if (!db || !bucket) {
    return jsonError("Music database or storage is not configured.", 503);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid multipart body.", 400);
  }

  const errors: FieldErrors = {};
  const title = text(formData.get("title"));
  const id = slugify(text(formData.get("id")) || title);
  const altText = text(formData.get("altText")) || null;
  const sortOrder = numberValue(formData.get("sortOrder"), 100);
  const existing = id ? await fetchArtwork(db, id) : null;

  if (!id) errors.id = "Enter an id or title.";
  if (!title) errors.title = "Title is required.";
  if (!existing && !getFile(formData, "image")?.size) {
    errors.image = "Image is required.";
  }

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  try {
    const imageKey = await putImageFile(
      bucket,
      `music-artwork/${id}`,
      "image",
      getFile(formData, "image"),
      !existing,
    );
    const nextImageKey = imageKey ?? existing?.image_key;

    await db
      .prepare(
        `INSERT INTO music_artworks (
          id,
          title,
          image_key,
          alt_text,
          sort_order,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          image_key = COALESCE(excluded.image_key, music_artworks.image_key),
          alt_text = excluded.alt_text,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at`,
      )
      .bind(
        id,
        title,
        nextImageKey,
        altText,
        sortOrder,
        new Date().toISOString(),
      )
      .run();

    const artwork = await fetchArtwork(db, id);
    return jsonOk({ artwork: artwork ? rowToAdminMusicArtwork(artwork) : null });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Music artwork could not be saved.",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const [db, bucket] = await Promise.all([getMusicDatabase(), getMusicBucket()]);
  if (!db) return jsonError("Music database is not configured.", 503);

  const body = await readJson<{ id?: unknown }>(request);
  const bodyId = typeof body?.id === "string" ? body.id.trim() : "";
  const id = bodyId || idFromRequestUrl(request);
  if (!id) return jsonError("Artwork id is required.", 422, { id: "Required." });

  const artwork = await fetchArtwork(db, id);
  await db
    .prepare(`UPDATE music_releases SET artwork_id = NULL, updated_at = ? WHERE artwork_id = ?`)
    .bind(new Date().toISOString(), id)
    .run();
  await db.prepare(`DELETE FROM music_artworks WHERE id = ?`).bind(id).run();

  if (artwork && bucket) await bucket.delete(artwork.image_key);

  return jsonOk({ id });
}
