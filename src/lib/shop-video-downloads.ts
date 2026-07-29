import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppOrigin, getRuntimeValue } from "./runtime-env";

export type VideoDownloadRow = {
  id: string; order_id: string; order_item_id: string; asset_id: string;
  expires_at: string; download_count: number; max_downloads: number;
  original_filename: string; content_type: string; r2_key: string;
};

async function secret() {
  const value = await getRuntimeValue("DOWNLOAD_TOKEN_SECRET");
  if (!value || value.length < 32) throw new Error("Video downloads are not configured.");
  return value;
}

async function signature(row: Pick<VideoDownloadRow, "id" | "order_id" | "asset_id" | "expires_at">) {
  return createHmac("sha256", await secret())
    .update(`video|${row.id}|${row.order_id}|${row.asset_id}|${row.expires_at}`).digest("base64url");
}

export async function verifyVideoToken(token: string, row: VideoDownloadRow) {
  const separator = token.indexOf(".");
  if (separator < 1 || token.slice(0, separator) !== row.id) return false;
  const provided = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(await signature(row));
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function ensureOrderVideoAccess(db: D1Database, orderId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const uploads = await db.prepare(
    `SELECT oi.id AS order_item_id, a.id AS asset_id
     FROM shop_order_items oi JOIN shop_products p ON p.id = oi.product_id
     JOIN shop_product_video_assets a ON a.product_id = p.id
     WHERE oi.order_id = ? AND p.video_delivery_type = 'upload'`,
  ).bind(orderId).all<{ order_item_id: string; asset_id: string }>();
  if (uploads.results?.length) {
    await db.batch(uploads.results.map((item) => db.prepare(
      `INSERT OR IGNORE INTO shop_order_video_downloads
       (id, order_id, order_item_id, asset_id, expires_at) VALUES (?, ?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), orderId, item.order_item_id, item.asset_id, expiresAt)));
  }
  const stored = await db.prepare(
    `SELECT d.*, a.original_filename, a.content_type, a.r2_key
     FROM shop_order_video_downloads d JOIN shop_product_video_assets a ON a.id = d.asset_id
     WHERE d.order_id = ?`,
  ).bind(orderId).all<VideoDownloadRow>();
  const origin = await getAppOrigin();
  const storedLinks = await Promise.all((stored.results ?? []).map(async (row) => ({
    format: "video" as const,
    originalFilename: row.original_filename,
    url: `${origin}/api/shop/video-downloads/${encodeURIComponent(`${row.id}.${await signature(row)}`)}`,
    external: false,
  })));
  const external = await db.prepare(
    `SELECT p.name, p.video_external_url AS url FROM shop_order_items oi
     JOIN shop_products p ON p.id = oi.product_id JOIN shop_orders o ON o.id = oi.order_id
     WHERE oi.order_id = ? AND o.status = 'paid' AND p.video_delivery_type = 'link'
       AND p.video_external_url IS NOT NULL`,
  ).bind(orderId).all<{ name: string; url: string }>();
  return [...storedLinks, ...(external.results ?? []).map((item) => ({
    format: "video" as const, originalFilename: item.name, url: item.url, external: true,
  }))];
}
