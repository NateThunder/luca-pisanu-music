import { requireAdmin } from "@/lib/admin-auth";
import { getFile } from "@/lib/file-assets";
import { idFromRequestUrl, jsonError, jsonOk, numberValue, readJson, text, type FieldErrors } from "@/lib/admin-route-utils";
import { putEpkFile, validateBrowserImage } from "@/lib/epk-assets";
import { getEpkBucket, getEpkContent, getEpkDatabase } from "@/lib/epk-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const [db, bucket] = await Promise.all([getEpkDatabase(), getEpkBucket()]);
  if (!db || !bucket) return jsonError("EPK database or storage is not configured.", 503);

  let formData: FormData;
  try { formData = await request.formData(); } catch { return jsonError("Invalid multipart body.", 400); }
  const image = getFile(formData, "image");
  const title = text(formData.get("title"));
  const credit = text(formData.get("credit"));
  const sortOrder = numberValue(formData.get("sortOrder"), 100);
  const errors: FieldErrors = {};
  if (!image?.size) errors.image = "Choose an image.";
  if (!title) errors.title = "Title is required.";
  if (!credit) errors.credit = "Photographer credit is required.";
  if (Object.keys(errors).length || !image) return jsonError("Check the highlighted fields.", 422, errors);

  const id = crypto.randomUUID();
  let imageKey: string | null = null;
  try {
    await validateBrowserImage(image);
    imageKey = await putEpkFile(bucket, "epk/gallery", image);
    const now = new Date().toISOString();
    await db.prepare(
      `INSERT INTO epk_gallery
       (id, title, credit, image_key, original_filename, content_type, size_bytes, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, title, credit, imageKey, image.name, image.type, image.size, sortOrder, now).run();
    return jsonOk({ epk: await getEpkContent() });
  } catch (error) {
    if (imageKey) {
      try { await bucket.delete(imageKey); } catch { /* preserve original error */ }
    }
    return jsonError(error instanceof Error ? error.message : "Press photo could not be saved.", 422);
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const [db, bucket] = await Promise.all([getEpkDatabase(), getEpkBucket()]);
  if (!db) return jsonError("EPK database is not configured.", 503);
  const body = await readJson<{ id?: unknown }>(request);
  const id = text(body?.id) || idFromRequestUrl(request);
  if (!id) return jsonError("Gallery item id is required.", 422);
  const existing = await db.prepare("SELECT image_key FROM epk_gallery WHERE id=?").bind(id).first<{ image_key: string }>();
  await db.prepare("DELETE FROM epk_gallery WHERE id=?").bind(id).run();
  if (existing?.image_key && bucket) {
    try { await bucket.delete(existing.image_key); } catch { /* database deletion remains valid */ }
  }
  return jsonOk({ epk: await getEpkContent() });
}
