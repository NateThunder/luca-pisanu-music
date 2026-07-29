import { getShopBucket, getShopDatabase } from "@/lib/shop-data";
import { type DownloadRow, verifyDownloadToken } from "@/lib/shop-downloads";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const id = decodeURIComponent(token).split(".", 1)[0];
  const db = await getShopDatabase();
  const bucket = await getShopBucket();
  if (!db || !bucket || !id) return new Response("Not found", { status: 404 });

  const row = await db.prepare(
    `SELECT d.*, a.format, a.original_filename, a.r2_key
     FROM shop_order_downloads d
     JOIN shop_product_digital_assets a ON a.id = d.asset_id
     JOIN shop_orders o ON o.id = d.order_id
     WHERE d.id = ? AND o.status = 'paid' LIMIT 1`,
  ).bind(id).first<DownloadRow>();
  if (!row || !(await verifyDownloadToken(decodeURIComponent(token), row))) {
    return new Response("Invalid download link", { status: 404 });
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return new Response("This download link has expired", { status: 410 });
  }
  const object = await bucket.get(row.r2_key);
  if (!object) return new Response("File not found", { status: 404 });
  const now = new Date().toISOString();
  const update = await db.prepare(
    `UPDATE shop_order_downloads SET download_count = download_count + 1,
       last_downloaded_at = ? WHERE id = ? AND download_count < max_downloads`,
  ).bind(now, row.id).run();
  if (!update.meta.changes) return new Response("Download limit reached", { status: 429 });

  const filename = row.original_filename.replace(/[\r\n"\\]/g, "_");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", row.format === "mp3" ? "audio/mpeg" : "audio/wav");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Content-Length", String(object.size));
  return new Response(object.body, { headers });
}
