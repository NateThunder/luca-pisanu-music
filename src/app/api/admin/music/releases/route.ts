import type { Release } from "@/data/site";
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
  getMusicBucket,
  getMusicDatabase,
  getMusicPurchases,
  musicPurchaseProductId,
  rowToAdminMusicRelease,
  type MusicReleaseRow,
} from "@/lib/music-data";
import { getShopDatabase } from "@/lib/shop-data";
import { getFile } from "@/lib/file-assets";

export const dynamic = "force-dynamic";

const artworkValues = new Set<Release["artwork"]>([
  "portrait",
  "tower",
  "guitar",
  "waves",
]);

const audioTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/aac",
  "audio/ogg",
]);

const imageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type PatchBody = {
  action?: "visibility" | "reorder";
  id?: unknown;
  ids?: unknown;
  isVisible?: unknown;
};

const releaseColumns = `id,
  title,
  description,
  release_type,
  artwork,
  artwork_id,
  NULL AS selected_artwork_key,
  NULL AS selected_artwork_alt,
  cover_art_key,
  audio_key,
  listen_url,
  support_url,
  spotify_url,
  apple_music_url,
  tidal_url,
  youtube_url,
  soundcloud_url,
  bandcamp_url,
  sort_order,
  is_published,
  created_at,
  updated_at`;

function formText(formData: FormData, key: string) {
  return text(formData.get(key));
}

function formNullableUrl(formData: FormData, key: string, errors: FieldErrors) {
  return nullableUrl(formData.get(key), errors, key);
}

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "audio/mpeg" || file.type === "audio/mp3") return "mp3";
  if (file.type === "audio/wav" || file.type === "audio/x-wav") return "wav";
  return "bin";
}

async function putFile(
  bucket: R2Bucket,
  keyPrefix: string,
  field: "cover" | "audio",
  file: File | null,
  allowedTypes: Set<string>,
) {
  if (!file || file.size === 0) return null;

  if (!allowedTypes.has(file.type)) {
    throw new Error(`${field} has an unsupported file type.`);
  }

  const key = `${keyPrefix}/${field}.${extensionFor(file)}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return key;
}

async function fetchRelease(db: D1Database, id: string) {
  return await db
    .prepare(`SELECT ${releaseColumns} FROM music_releases WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<MusicReleaseRow>();
}

async function artworkExists(db: D1Database, id: string) {
  if (!id) return true;
  const row = await db
    .prepare(`SELECT id FROM music_artworks WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string }>();
  return Boolean(row);
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getMusicDatabase();
  if (!db) return jsonError("Music database is not configured.", 503);

  const result = await db
    .prepare(
        `SELECT music_releases.id,
                music_releases.title,
                music_releases.description,
                music_releases.release_type,
                music_releases.artwork,
                music_releases.artwork_id,
                music_artworks.image_key AS selected_artwork_key,
                music_artworks.alt_text AS selected_artwork_alt,
                music_releases.cover_art_key,
                music_releases.audio_key,
                music_releases.listen_url,
                music_releases.support_url,
                music_releases.spotify_url,
                music_releases.apple_music_url,
                music_releases.tidal_url,
                music_releases.youtube_url,
                music_releases.soundcloud_url,
                music_releases.bandcamp_url,
                music_releases.sort_order,
                music_releases.is_published,
                music_releases.created_at,
                music_releases.updated_at
       FROM music_releases
       LEFT JOIN music_artworks ON music_artworks.id = music_releases.artwork_id
       ORDER BY music_releases.sort_order ASC, music_releases.title ASC`,
    )
    .all<MusicReleaseRow>();

  const rows = result.results ?? [];
  const purchases = await getMusicPurchases(rows.map((row) => row.id));
  return jsonOk({
    releases: rows.map((row) => {
      const release = rowToAdminMusicRelease(row);
      const purchase = purchases.get(row.id);
      return purchase ? { ...release, ...purchase, purchaseProductId: purchase.productId } : release;
    }),
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const [db, bucket, shopDb] = await Promise.all([
    getMusicDatabase(),
    getMusicBucket(),
    getShopDatabase(),
  ]);
  if (!db || !bucket || !shopDb) {
    return jsonError("Music, shop database, or storage is not configured.", 503);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid multipart body.", 400);
  }

  const errors: FieldErrors = {};
  const title = formText(formData, "title");
  const description = formText(formData, "description");
  const releaseTypeInput = formText(formData, "releaseType");
  const releaseType = releaseTypeInput === "ALBUM" || releaseTypeInput === "EP" || releaseTypeInput === "SINGLE"
    ? releaseTypeInput
    : "SINGLE";
  const id = slugify(formText(formData, "id") || title);
  const artworkInput = formText(formData, "artwork") || "portrait";
  const artwork = artworkValues.has(artworkInput as Release["artwork"])
    ? (artworkInput as Release["artwork"])
    : "portrait";
  const sortOrder = numberValue(formData.get("sortOrder"), 100);
  const isVisible = booleanValue(formData.get("isVisible"), true);
  const isForSale = booleanValue(formData.get("isForSale"), false);
  const purchasePriceGbp = numberValue(formData.get("purchasePriceGbp"), 1.99);
  const purchasePriceEur = numberValue(formData.get("purchasePriceEur"), 1.99);
  const purchasePriceUsd = numberValue(formData.get("purchasePriceUsd"), 1.99);
  const artworkId = text(formData.get("artworkId")) || null;

  if (!id) errors.id = "Enter an id or title.";
  if (!title) errors.title = "Title is required.";
  if (!description) errors.description = "Description is required.";
  for (const [field, amount] of [["purchasePriceGbp", purchasePriceGbp], ["purchasePriceEur", purchasePriceEur], ["purchasePriceUsd", purchasePriceUsd]] as const) {
    if (isForSale && (amount < 0 || amount > 100)) errors[field] = "Enter a minimum from 0 to 100.";
  }
  if (artworkId && !(await artworkExists(db, artworkId))) {
    errors.artworkId = "Select an existing artwork.";
  }

  const listenUrl = formNullableUrl(formData, "listenUrl", errors);
  const supportUrl = formNullableUrl(formData, "supportUrl", errors);
  const spotifyUrl = formNullableUrl(formData, "spotifyUrl", errors);
  const appleMusicUrl = formNullableUrl(formData, "appleMusicUrl", errors);
  const tidalUrl = formNullableUrl(formData, "tidalUrl", errors);
  const youtubeUrl = formNullableUrl(formData, "youtubeUrl", errors);
  const soundcloudUrl = formNullableUrl(formData, "soundcloudUrl", errors);
  const bandcampUrl = formNullableUrl(formData, "bandcampUrl", errors);

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  const keyPrefix = `music/${id}`;
  const purchaseProductId = musicPurchaseProductId(id);

  if (isForSale) {
    const formats = await shopDb.prepare(
      `SELECT format FROM shop_product_digital_assets WHERE product_id = ?`,
    ).bind(purchaseProductId).all<{ format: string }>();
    const availableFormats = new Set((formats.results ?? []).map((row) => row.format));
    if (!availableFormats.has("mp3") || !availableFormats.has("wav")) {
      errors.isForSale = "Upload both the purchased MP3 and WAV before making this release available.";
    }
  }

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  try {
    const [coverArtKey, audioKey] = await Promise.all([
      putFile(bucket, keyPrefix, "cover", getFile(formData, "coverArt"), imageTypes),
      putFile(bucket, keyPrefix, "audio", getFile(formData, "audio"), audioTypes),
    ]);
    const updatedAt = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO music_releases (
          id,
          title,
          description,
          release_type,
          artwork,
          artwork_id,
          cover_art_key,
          audio_key,
          listen_url,
          support_url,
          spotify_url,
          apple_music_url,
          tidal_url,
          youtube_url,
          soundcloud_url,
          bandcamp_url,
          sort_order,
          is_published,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          release_type = excluded.release_type,
          artwork = excluded.artwork,
          artwork_id = excluded.artwork_id,
          cover_art_key = COALESCE(excluded.cover_art_key, music_releases.cover_art_key),
          audio_key = COALESCE(excluded.audio_key, music_releases.audio_key),
          listen_url = excluded.listen_url,
          support_url = excluded.support_url,
          spotify_url = excluded.spotify_url,
          apple_music_url = excluded.apple_music_url,
          tidal_url = excluded.tidal_url,
          youtube_url = excluded.youtube_url,
          soundcloud_url = excluded.soundcloud_url,
          bandcamp_url = excluded.bandcamp_url,
          sort_order = excluded.sort_order,
          is_published = excluded.is_published,
          updated_at = excluded.updated_at`,
      )
      .bind(
        id,
        title,
        description,
        releaseType,
        artwork,
        artworkId,
        coverArtKey,
        audioKey,
        listenUrl,
        supportUrl,
        spotifyUrl,
        appleMusicUrl,
        tidalUrl,
        youtubeUrl,
        soundcloudUrl,
        bandcampUrl,
        sortOrder,
        isVisible ? 1 : 0,
        updatedAt,
      )
      .run();

    await shopDb.prepare(
      `INSERT INTO shop_products (
         id, name, category, category_slug, note, description,
         price_gbp, price_eur, price_usd, status, sale_mode, product_type,
         track_inventory, stock_quantity, artwork, artwork_id, sort_order,
         is_active, updated_at
       ) VALUES (?, ?, 'Music', '_music-release', ?, ?, ?, ?, ?,
                 'MP3 + WAV digital download', ?, 'digital', 0, 0, 'vinyl', NULL, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         note = excluded.note,
         description = excluded.description,
         price_gbp = excluded.price_gbp,
         price_eur = excluded.price_eur,
         price_usd = excluded.price_usd,
         status = excluded.status,
         sale_mode = excluded.sale_mode,
         product_type = 'digital',
         track_inventory = 0,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`,
    ).bind(
      purchaseProductId,
      title,
      "Includes private MP3 and WAV downloads.",
      description,
      purchasePriceGbp,
      purchasePriceEur,
      purchasePriceUsd,
      isForSale ? "purchase" : "unavailable",
      sortOrder,
      isForSale ? 1 : 0,
      updatedAt,
    ).run();

    const release = await fetchRelease(db, id);
    const purchases = await getMusicPurchases([id]);
    const purchase = purchases.get(id);
    return jsonOk({
      release: release
        ? { ...rowToAdminMusicRelease(release), ...(purchase ?? {}) }
        : null,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Music release could not be saved.",
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getMusicDatabase();
  if (!db) return jsonError("Music database is not configured.", 503);

  const body = await readJson<PatchBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  if (body.action === "reorder") {
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
    if (!ids.length) return jsonError("Release ids are required.", 422);

    await db.batch(
      ids.map((id, index) =>
        db
          .prepare(`UPDATE music_releases SET sort_order = ?, updated_at = ? WHERE id = ?`)
          .bind((index + 1) * 10, new Date().toISOString(), id),
      ),
    );

    return jsonOk({ ids });
  }

  if (body.action === "visibility") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return jsonError("Release id is required.", 422, { id: "Required." });

    const isVisible = booleanValue(body.isVisible, false);
    await db
      .prepare(`UPDATE music_releases SET is_published = ?, updated_at = ? WHERE id = ?`)
      .bind(isVisible ? 1 : 0, new Date().toISOString(), id)
      .run();

    return jsonOk({ id, isVisible });
  }

  return jsonError("Unsupported action.", 400);
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const [db, bucket] = await Promise.all([getMusicDatabase(), getMusicBucket()]);
  if (!db) return jsonError("Music database is not configured.", 503);

  const body = await readJson<{ id?: unknown }>(request);
  const bodyId = typeof body?.id === "string" ? body.id.trim() : "";
  const id = bodyId || idFromRequestUrl(request);
  if (!id) return jsonError("Release id is required.", 422, { id: "Required." });

  const release = await fetchRelease(db, id);
  if (release && bucket) {
    const keys = [release.cover_art_key, release.audio_key].filter(
      (key): key is string => Boolean(key),
    );
    if (keys.length) await bucket.delete(keys);
  }

  await db.prepare(`DELETE FROM music_releases WHERE id = ?`).bind(id).run();
  const shopDb = await getShopDatabase();
  if (shopDb) {
    await shopDb.prepare(
      `UPDATE shop_products SET is_active = 0, sale_mode = 'unavailable', updated_at = ? WHERE id = ?`,
    ).bind(new Date().toISOString(), musicPurchaseProductId(id)).run();
  }

  return jsonOk({ id });
}
