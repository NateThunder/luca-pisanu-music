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
  getShopBucket,
  getShopDatabase,
  rowToAdminShopArtwork,
  type ShopArtworkRow,
} from "@/lib/shop-data";

export const dynamic = "force-dynamic";

const columns = `id,
  title,
  front_key,
  back_key,
  alt_text,
  sort_order,
  created_at,
  updated_at`;

async function fetchArtwork(db: D1Database, id: string) {
  return await db
    .prepare(`SELECT ${columns} FROM shop_artworks WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<ShopArtworkRow>();
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);

  const result = await db
    .prepare(`SELECT ${columns} FROM shop_artworks ORDER BY sort_order ASC, title ASC`)
    .all<ShopArtworkRow>();

  return jsonOk({
    artworks: (result.results ?? []).map(rowToAdminShopArtwork),
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const [db, bucket] = await Promise.all([getShopDatabase(), getShopBucket()]);
  if (!db || !bucket) {
    return jsonError("Shop database or storage is not configured.", 503);
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
  if (!existing && !getFile(formData, "front")?.size) {
    errors.front = "Front image is required.";
  }

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  try {
    const [frontKey, backKey] = await Promise.all([
      putImageFile(bucket, `shop-artwork/${id}`, "front", getFile(formData, "front"), !existing),
      putImageFile(bucket, `shop-artwork/${id}`, "back", getFile(formData, "back")),
    ]);
    const nextFrontKey = frontKey ?? existing?.front_key;
    const nextBackKey = backKey ?? existing?.back_key ?? null;

    await db
      .prepare(
        `INSERT INTO shop_artworks (
          id,
          title,
          front_key,
          back_key,
          alt_text,
          sort_order,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          front_key = COALESCE(excluded.front_key, shop_artworks.front_key),
          back_key = COALESCE(excluded.back_key, shop_artworks.back_key),
          alt_text = excluded.alt_text,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at`,
      )
      .bind(
        id,
        title,
        nextFrontKey,
        nextBackKey,
        altText,
        sortOrder,
        new Date().toISOString(),
      )
      .run();

    const artwork = await fetchArtwork(db, id);
    return jsonOk({ artwork: artwork ? rowToAdminShopArtwork(artwork) : null });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Shop artwork could not be saved.",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const [db, bucket] = await Promise.all([getShopDatabase(), getShopBucket()]);
  if (!db) return jsonError("Shop database is not configured.", 503);

  const body = await readJson<{ id?: unknown }>(request);
  const bodyId = typeof body?.id === "string" ? body.id.trim() : "";
  const id = bodyId || idFromRequestUrl(request);
  if (!id) return jsonError("Artwork id is required.", 422, { id: "Required." });

  const artwork = await fetchArtwork(db, id);
  await db
    .prepare(`UPDATE shop_products SET artwork_id = NULL, updated_at = ? WHERE artwork_id = ?`)
    .bind(new Date().toISOString(), id)
    .run();
  await db.prepare(`DELETE FROM shop_artworks WHERE id = ?`).bind(id).run();

  if (artwork && bucket) {
    await bucket.delete([artwork.front_key, artwork.back_key].filter((key): key is string => Boolean(key)));
  }

  return jsonOk({ id });
}
