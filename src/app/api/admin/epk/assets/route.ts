import { requireAdmin } from "@/lib/admin-auth";
import { getFile } from "@/lib/file-assets";
import { jsonError, jsonOk, type FieldErrors } from "@/lib/admin-route-utils";
import { putEpkFile, validateBrowserImage, validatePdf } from "@/lib/epk-assets";
import { getEpkBucket, getEpkContent, getEpkDatabase } from "@/lib/epk-data";

export const dynamic = "force-dynamic";

const columns = {
  hero: "hero_image_key",
  portrait: "portrait_image_key",
  pdf: "pdf_key",
} as const;

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const [db, bucket] = await Promise.all([getEpkDatabase(), getEpkBucket()]);
  if (!db || !bucket) return jsonError("EPK database or storage is not configured.", 503);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid multipart body.", 400);
  }
  const kind = String(formData.get("kind") || "") as keyof typeof columns;
  const file = getFile(formData, "file");
  const errors: FieldErrors = {};
  if (!(kind in columns)) errors.kind = "Choose an EPK asset.";
  if (!file?.size) errors.file = "Choose a file.";
  if (Object.keys(errors).length || !file) return jsonError("Check the highlighted fields.", 422, errors);

  let newKey: string | null = null;
  try {
    if (kind === "pdf") await validatePdf(file);
    else await validateBrowserImage(file);

    const existing = await db.prepare(
      `SELECT ${columns[kind]} AS asset_key FROM epk_pages WHERE id='epk'`,
    ).first<{ asset_key: string | null }>();
    newKey = await putEpkFile(bucket, `epk/${kind}`, file);
    const pdfName = kind === "pdf" ? ", pdf_original_filename=?" : "";
    await db.prepare(
      `UPDATE epk_pages SET ${columns[kind]}=?${pdfName}, updated_at=? WHERE id='epk'`,
    ).bind(
      newKey,
      ...(kind === "pdf" ? [file.name] : []),
      new Date().toISOString(),
    ).run();
    if (existing?.asset_key && existing.asset_key !== newKey) {
      try { await bucket.delete(existing.asset_key); } catch { /* stale cleanup is non-fatal */ }
    }
    return jsonOk({ epk: await getEpkContent() });
  } catch (error) {
    if (newKey) {
      try { await bucket.delete(newKey); } catch { /* preserve original error */ }
    }
    return jsonError(error instanceof Error ? error.message : "EPK asset could not be saved.", 422);
  }
}
