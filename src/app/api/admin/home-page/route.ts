import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, numberValue, type FieldErrors } from "@/lib/admin-route-utils";
import { getFile, putImageFile } from "@/lib/file-assets";
import {
  homePageMediaColumns,
  rowToHomePageMedia,
  type HomePageMediaRow,
} from "@/lib/home-page-data";
import { getMusicBucket, getMusicDatabase } from "@/lib/music-data";

export const dynamic = "force-dynamic";

const maxImageBytes = 15 * 1024 * 1024;

async function fetchMedia(db: D1Database) {
  return db
    .prepare(`SELECT ${homePageMediaColumns} FROM home_page_media WHERE id = 'home' LIMIT 1`)
    .first<HomePageMediaRow>();
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getMusicDatabase();
  if (!db) return jsonError("Music database is not configured.", 503);

  try {
    return jsonOk({ media: rowToHomePageMedia(await fetchMedia(db)) });
  } catch {
    return jsonError("Run the latest music database migration to enable homepage pictures.", 503);
  }
}

function bounded(value: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  return Math.min(max, Math.max(min, numberValue(value, fallback)));
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

  const kind = formData.get("kind");
  const errors: FieldErrors = {};
  if (kind !== "banner" && kind !== "connect") errors.kind = "Choose a homepage picture.";

  const image = getFile(formData, "image");
  if (image && image.size > maxImageBytes) errors.image = "Choose an image smaller than 15 MB.";
  if (Object.keys(errors).length) return jsonError("Check the highlighted fields.", 422, errors);

  const mediaKind = kind as "banner" | "connect";
  let existing: HomePageMediaRow | null;
  try {
    existing = await fetchMedia(db);
  } catch {
    return jsonError("Run the latest music database migration to enable homepage pictures.", 503);
  }

  const oldKey = mediaKind === "banner" ? existing?.banner_image_key : existing?.connect_image_key;
  let imageKey: string | null = null;

  try {
    imageKey = await putImageFile(
      bucket,
      `home-page/${mediaKind}/${crypto.randomUUID()}`,
      "source",
      image,
    );

    const prefix = mediaKind === "banner" ? "banner" : "connect";
    const desktopX = bounded(formData.get("desktopX"), 0, 100, 50);
    const desktopY = bounded(formData.get("desktopY"), 0, 100, 50);
    const desktopZoom = bounded(formData.get("desktopZoom"), 1, 2.5, 1);
    const mobileX = bounded(formData.get("mobileX"), 0, 100, 50);
    const mobileY = bounded(formData.get("mobileY"), 0, 100, 50);
    const mobileZoom = bounded(formData.get("mobileZoom"), 1, 2.5, 1);
    const keyColumn = `${prefix}_image_key`;

    await db
      .prepare(
        `INSERT INTO home_page_media (
          id, ${keyColumn},
          ${prefix}_desktop_x, ${prefix}_desktop_y, ${prefix}_desktop_zoom,
          ${prefix}_mobile_x, ${prefix}_mobile_y, ${prefix}_mobile_zoom,
          updated_at
        ) VALUES ('home', ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          ${keyColumn} = COALESCE(excluded.${keyColumn}, home_page_media.${keyColumn}),
          ${prefix}_desktop_x = excluded.${prefix}_desktop_x,
          ${prefix}_desktop_y = excluded.${prefix}_desktop_y,
          ${prefix}_desktop_zoom = excluded.${prefix}_desktop_zoom,
          ${prefix}_mobile_x = excluded.${prefix}_mobile_x,
          ${prefix}_mobile_y = excluded.${prefix}_mobile_y,
          ${prefix}_mobile_zoom = excluded.${prefix}_mobile_zoom,
          updated_at = excluded.updated_at`,
      )
      .bind(
        imageKey,
        desktopX,
        desktopY,
        desktopZoom,
        mobileX,
        mobileY,
        mobileZoom,
        new Date().toISOString(),
      )
      .run();

    if (imageKey && oldKey && oldKey !== imageKey) {
      try {
        await bucket.delete(oldKey);
      } catch {
        // The newly saved image remains valid if stale-file cleanup fails.
      }
    }
    return jsonOk({ media: rowToHomePageMedia(await fetchMedia(db)) });
  } catch (error) {
    if (imageKey) {
      try {
        await bucket.delete(imageKey);
      } catch {
        // Preserve the original save error when cleanup also fails.
      }
    }
    return jsonError(error instanceof Error ? error.message : "Homepage picture could not be saved.", 500);
  }
}
