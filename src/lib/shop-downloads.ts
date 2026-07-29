import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppOrigin, getRuntimeValue } from "./runtime-env";

type DownloadRow = {
  id: string; order_id: string; order_item_id: string; asset_id: string;
  expires_at: string; download_count: number; max_downloads: number;
  format: "mp3" | "wav"; original_filename: string; r2_key: string;
};

async function secret() {
  const value = await getRuntimeValue("DOWNLOAD_TOKEN_SECRET");
  if (!value || value.length < 32) throw new Error("Digital downloads are not configured.");
  return value;
}

async function signature(id: string, orderId: string, assetId: string, expiresAt: string) {
  return createHmac("sha256", await secret())
    .update(`${id}|${orderId}|${assetId}|${expiresAt}`)
    .digest("base64url");
}

export async function tokenForDownload(row: Pick<DownloadRow, "id" | "order_id" | "asset_id" | "expires_at">) {
  return `${row.id}.${await signature(row.id, row.order_id, row.asset_id, row.expires_at)}`;
}

export async function verifyDownloadToken(token: string, row: DownloadRow) {
  const separator = token.indexOf(".");
  if (separator < 1 || token.slice(0, separator) !== row.id) return false;
  const provided = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(await signature(row.id, row.order_id, row.asset_id, row.expires_at));
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function ensureOrderDownloads(db: D1Database, orderId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const assets = await db.prepare(
    `SELECT oi.id AS order_item_id, a.id AS asset_id
     FROM shop_order_items oi
     JOIN shop_product_digital_assets a ON a.product_id = oi.product_id
     WHERE oi.order_id = ? AND oi.product_type = 'digital'`,
  ).bind(orderId).all<{ order_item_id: string; asset_id: string }>();
  if (assets.results?.length) {
    await db.batch(assets.results.map((asset) => db.prepare(
      `INSERT OR IGNORE INTO shop_order_downloads
       (id, order_id, order_item_id, asset_id, expires_at, max_downloads)
       VALUES (?, ?, ?, ?, ?, 10)`,
    ).bind(crypto.randomUUID(), orderId, asset.order_item_id, asset.asset_id, expiresAt)));
  }
  const result = await db.prepare(
    `SELECT d.*, a.format, a.original_filename, a.r2_key
     FROM shop_order_downloads d
     JOIN shop_product_digital_assets a ON a.id = d.asset_id
     WHERE d.order_id = ? ORDER BY d.order_item_id, a.format`,
  ).bind(orderId).all<DownloadRow>();
  const origin = await getAppOrigin();
  return await Promise.all((result.results ?? []).map(async (row) => ({
    ...row,
    url: `${origin}/api/shop/downloads/${encodeURIComponent(await tokenForDownload(row))}`,
  })));
}

export type { DownloadRow };
