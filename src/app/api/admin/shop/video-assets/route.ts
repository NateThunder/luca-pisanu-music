import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, readJson } from "@/lib/admin-route-utils";
import { getShopBucket, getShopDatabase } from "@/lib/shop-data";

export const dynamic = "force-dynamic";
const maxBytes = 500 * 1024 * 1024;
const allowedTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "application/octet-stream"]);

function safeFilename(value: string) {
  return value.replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "video.mp4";
}

async function videoProduct(db: D1Database, productId: string) {
  return await db.prepare(
    `SELECT id FROM shop_products WHERE id = ? AND product_type = 'digital' AND video_delivery_type = 'upload' LIMIT 1`,
  ).bind(productId).first<{ id: string }>();
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await readJson<{
    action?: unknown; productId?: unknown; filename?: unknown; contentType?: unknown;
    sizeBytes?: unknown; key?: unknown; uploadId?: unknown;
    parts?: Array<{ partNumber?: unknown; etag?: unknown }>;
  }>(request);
  const action = typeof body?.action === "string" ? body.action : "";
  const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
  const db = await getShopDatabase();
  const bucket = await getShopBucket();
  if (!db || !bucket) return jsonError("Video storage is not configured.", 503);
  if (!productId || !(await videoProduct(db, productId))) {
    return jsonError("Save the product with video upload selected first.", 422);
  }
  if (action === "start") {
    const sizeBytes = Number(body?.sizeBytes);
    const contentType = typeof body?.contentType === "string" ? body.contentType : "application/octet-stream";
    if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > maxBytes) {
      return jsonError("Choose a video file no larger than 500 MB.", 413);
    }
    if (!allowedTypes.has(contentType)) return jsonError("Choose an MP4, WebM, or MOV video.", 415);
    const extension = contentType === "video/webm" ? "webm" : contentType === "video/quicktime" ? "mov" : "mp4";
    const key = `video/${productId}/${crypto.randomUUID()}.${extension}`;
    const upload = await bucket.createMultipartUpload(key, { httpMetadata: { contentType } });
    return jsonOk({ key, uploadId: upload.uploadId });
  }
  if (action !== "complete") return jsonError("Unsupported upload action.", 400);
  const key = typeof body?.key === "string" ? body.key : "";
  const uploadId = typeof body?.uploadId === "string" ? body.uploadId : "";
  if (!key.startsWith(`video/${productId}/`) || !uploadId || !body?.parts?.length) {
    return jsonError("Invalid multipart upload.", 422);
  }
  const parts = body.parts.map((part) => ({ partNumber: Number(part.partNumber), etag: String(part.etag || "") }));
  const upload = bucket.resumeMultipartUpload(key, uploadId);
  await upload.complete(parts);
  const old = await db.prepare(
    `SELECT id, r2_key FROM shop_product_video_assets WHERE product_id = ?`,
  ).bind(productId).first<{ id: string; r2_key: string }>();
  const id = old?.id ?? crypto.randomUUID();
  const filename = safeFilename(typeof body.filename === "string" ? body.filename : "video.mp4");
  const contentType = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
  const sizeBytes = Number(body.sizeBytes);
  try {
    const now = new Date().toISOString();
    await db.prepare(
      `INSERT INTO shop_product_video_assets
       (id, product_id, r2_key, original_filename, content_type, size_bytes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET r2_key = excluded.r2_key,
         original_filename = excluded.original_filename, content_type = excluded.content_type,
         size_bytes = excluded.size_bytes, updated_at = excluded.updated_at`,
    ).bind(id, productId, key, filename, contentType, sizeBytes, now).run();
  } catch (error) {
    await bucket.delete(key);
    throw error;
  }
  if (old?.r2_key && old.r2_key !== key) await bucket.delete(old.r2_key);
  return jsonOk({ id, productId, originalFilename: filename, sizeBytes });
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId")?.trim() ?? "";
  const key = url.searchParams.get("key") ?? "";
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const partNumber = Number(url.searchParams.get("partNumber"));
  const length = Number(request.headers.get("content-length"));
  if (!key.startsWith(`video/${productId}/`) || !uploadId || !Number.isInteger(partNumber) ||
      partNumber < 1 || !request.body || !Number.isInteger(length) || length < 1 || length > 50 * 1024 * 1024) {
    return jsonError("Invalid video upload part.", 422);
  }
  const db = await getShopDatabase();
  const bucket = await getShopBucket();
  if (!db || !bucket || !(await videoProduct(db, productId))) return jsonError("Video storage is not configured.", 503);
  const uploaded = await bucket.resumeMultipartUpload(key, uploadId).uploadPart(partNumber, request.body);
  return jsonOk({ etag: uploaded.etag, partNumber });
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await readJson<{ id?: unknown }>(request);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) return jsonError("File id is required.", 422);
  const db = await getShopDatabase();
  const bucket = await getShopBucket();
  if (!db || !bucket) return jsonError("Video storage is not configured.", 503);
  const row = await db.prepare(`SELECT r2_key FROM shop_product_video_assets WHERE id = ?`).bind(id).first<{ r2_key: string }>();
  if (!row) return jsonError("File not found.", 404);
  await db.prepare(`DELETE FROM shop_product_video_assets WHERE id = ?`).bind(id).run();
  await bucket.delete(row.r2_key);
  return jsonOk({ id });
}
