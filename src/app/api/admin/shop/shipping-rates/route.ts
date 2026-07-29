import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, numberValue, readJson, text } from "@/lib/admin-route-utils";
import {
  getShopDatabase,
  rowToAdminShippingRate,
  type ShippingRateRow,
} from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type ShippingBody = {
  id?: unknown;
  productId?: unknown;
  countryCode?: unknown;
  feeGbp?: unknown;
  feeEur?: unknown;
  feeUsd?: unknown;
};

function toMinor(value: unknown) {
  const amount = numberValue(value, Number.NaN);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await readJson<ShippingBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);
  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);

  const productId = text(body.productId);
  const countryCode = text(body.countryCode).toUpperCase();
  const feeGbp = toMinor(body.feeGbp);
  const feeEur = toMinor(body.feeEur);
  const feeUsd = toMinor(body.feeUsd);
  if (!productId || !/^[A-Z]{2}$/.test(countryCode) || feeGbp === null || feeEur === null || feeUsd === null) {
    return jsonError("Check the country and delivery prices.", 422);
  }

  const product = await db
    .prepare(`SELECT id FROM shop_products WHERE id = ? LIMIT 1`)
    .bind(productId)
    .first<{ id: string }>();
  if (!product) return jsonError("Product not found.", 404);

  const existing = await db
    .prepare(
      `SELECT id FROM shop_product_shipping_rates
       WHERE product_id = ? AND country_code = ? LIMIT 1`,
    )
    .bind(productId, countryCode)
    .first<{ id: string }>();
  const id = existing?.id || text(body.id) || crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO shop_product_shipping_rates (
         id, product_id, country_code, fee_gbp_minor, fee_eur_minor, fee_usd_minor, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(product_id, country_code) DO UPDATE SET
         fee_gbp_minor = excluded.fee_gbp_minor,
         fee_eur_minor = excluded.fee_eur_minor,
         fee_usd_minor = excluded.fee_usd_minor,
         updated_at = excluded.updated_at`,
    )
    .bind(id, productId, countryCode, feeGbp, feeEur, feeUsd, new Date().toISOString())
    .run();

  const rate = await db
    .prepare(
      `SELECT id, product_id, country_code, fee_gbp_minor, fee_eur_minor, fee_usd_minor
       FROM shop_product_shipping_rates WHERE product_id = ? AND country_code = ? LIMIT 1`,
    )
    .bind(productId, countryCode)
    .first<ShippingRateRow>();
  return jsonOk({ rate: rate ? rowToAdminShippingRate(rate) : null });
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await readJson<{ id?: unknown }>(request);
  const id = text(body?.id);
  if (!id) return jsonError("Delivery rate id is required.", 422);
  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);
  await db.prepare(`DELETE FROM shop_product_shipping_rates WHERE id = ?`).bind(id).run();
  return jsonOk({ id });
}
