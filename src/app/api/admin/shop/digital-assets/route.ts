import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, readJson } from "@/lib/admin-route-utils";
import { getShopBucket, getShopDatabase } from "@/lib/shop-data";

export const dynamic = "force-dynamic";
const maxBytes = 95 * 1024 * 1024;

function safeFilename(value: string, format: "mp3" | "wav") {
  const cleaned = value.replace(/[\r\n"\\/]/g, "_").slice(0, 180);
  return cleaned.toLowerCase().endsWith(`.${format}`) ? cleaned : `${cleaned || "audio"}.${format}`;
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const productId = (url.searchParams.get("productId") || "").trim();
  const format = url.searchParams.get("format") === "wav" ? "wav" :
    url.searchParams.get("format") === "mp3" ? "mp3" : null;
  const length = Number(request.headers.get("content-length"));
  if (!productId || !format) return jsonError("Product and format are required.", 422);
  if (!Number.isInteger(length) || length < 1 || length > maxBytes || !request.body) {
    return jsonError("Choose an audio file smaller than 95 MB.", 413);
  }
  const contentType = request.headers.get("content-type") || "application/octet-stream";
  if ((format === "mp3" && !["audio/mpeg", "audio/mp3", "application/octet-stream"].includes(contentType)) ||
      (format === "wav" && !["audio/wav", "audio/wave", "audio/x-wav", "application/octet-stream"].includes(contentType))) {
    return jsonError(`Choose a valid ${format.toUpperCase()} file.`, 415);
  }
  const db = await getShopDatabase();
  const bucket = await getShopBucket();
  if (!db || !bucket) return jsonError("Digital storage is not configured.", 503);
  const product = await db.prepare(
    `SELECT id FROM shop_products WHERE id = ? AND product_type = 'digital' LIMIT 1`,
  ).bind(productId).first<{ id: string }>();
  if (!product) return jsonError("Select a digital product first.", 422);

  const old = await db.prepare(
    `SELECT id, r2_key FROM shop_product_digital_assets WHERE product_id = ? AND format = ?`,
  ).bind(productId, format).first<{ id: string; r2_key: string }>();
  const id = old?.id ?? crypto.randomUUID();
  const key = `digital/${productId}/${format}/${crypto.randomUUID()}.${format}`;
  const filename = safeFilename(request.headers.get("x-file-name") || "audio", format);
  const fixedLengthStream = new FixedLengthStream(length);
  await Promise.all([
    request.body.pipeTo(fixedLengthStream.writable),
    bucket.put(key, fixedLengthStream.readable, { httpMetadata: { contentType } }),
  ]);
  try {
    const now = new Date().toISOString();
    await db.prepare(
      `INSERT INTO shop_product_digital_assets
       (id, product_id, format, r2_key, original_filename, content_type, size_bytes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(product_id, format) DO UPDATE SET r2_key = excluded.r2_key,
         original_filename = excluded.original_filename, content_type = excluded.content_type,
         size_bytes = excluded.size_bytes, updated_at = excluded.updated_at`,
    ).bind(id, productId, format, key, filename, contentType, length, now).run();
  } catch (error) {
    await bucket.delete(key);
    throw error;
  }
  if (old?.r2_key && old.r2_key !== key) await bucket.delete(old.r2_key);
  return jsonOk({ id, productId, format, originalFilename: filename, sizeBytes: length });
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await readJson<{ id?: unknown }>(request);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) return jsonError("File id is required.", 422);
  const db = await getShopDatabase();
  const bucket = await getShopBucket();
  if (!db || !bucket) return jsonError("Digital storage is not configured.", 503);
  const row = await db.prepare(
    `SELECT r2_key FROM shop_product_digital_assets WHERE id = ? LIMIT 1`,
  ).bind(id).first<{ r2_key: string }>();
  if (!row) return jsonError("File not found.", 404);
  await db.prepare(`DELETE FROM shop_product_digital_assets WHERE id = ?`).bind(id).run();
  await bucket.delete(row.r2_key);
  return jsonOk({ id });
}
