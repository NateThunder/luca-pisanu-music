import { requireAdmin } from "@/lib/admin-auth";
import { booleanValue, jsonError, jsonOk, numberValue, readJson, text } from "@/lib/admin-route-utils";
import { getShopDatabase, rowToAdminShopVariant, type ShopVariantRow } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type VariantBody = {
  id?: unknown;
  productId?: unknown;
  label?: unknown;
  sku?: unknown;
  options?: unknown;
  stockQuantity?: unknown;
  isAvailable?: unknown;
  sortOrder?: unknown;
};

function normalizeOptions(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (!entries.length || entries.length > 10) return null;

  const normalized: Record<string, string> = {};
  for (const [key, option] of entries) {
    if (typeof option !== "string") return null;
    const cleanKey = key.trim();
    const cleanOption = option.trim();
    if (!cleanKey || cleanKey.length > 40 || !cleanOption || cleanOption.length > 80) return null;
    normalized[cleanKey] = cleanOption;
  }
  return normalized;
}

async function fetchVariant(db: D1Database, id: string) {
  return await db
    .prepare(
      `SELECT id, product_id, label, sku, options_json, stock_quantity, is_active, sort_order
       FROM shop_product_variants WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<ShopVariantRow>();
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await readJson<VariantBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);
  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);

  const id = text(body.id) || crypto.randomUUID();
  const productId = text(body.productId);
  const label = text(body.label);
  const sku = text(body.sku);
  const options = normalizeOptions(body.options);
  const stockQuantity = Math.max(0, Math.floor(numberValue(body.stockQuantity, 0)));
  const isAvailable = booleanValue(body.isAvailable, true);
  const sortOrder = Math.floor(numberValue(body.sortOrder, 100));

  if (!productId || !label || label.length > 120 || sku.length > 80 || !options) {
    return jsonError("Check the variant details.", 422);
  }
  const product = await db
    .prepare(`SELECT id FROM shop_products WHERE id = ? LIMIT 1`)
    .bind(productId)
    .first<{ id: string }>();
  if (!product) return jsonError("Product not found.", 404);

  await db
    .prepare(
      `INSERT INTO shop_product_variants (
         id, product_id, label, sku, options_json, stock_quantity, is_active, sort_order, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         label = excluded.label,
         sku = excluded.sku,
         options_json = excluded.options_json,
         stock_quantity = excluded.stock_quantity,
         is_active = excluded.is_active,
         sort_order = excluded.sort_order,
         updated_at = excluded.updated_at
       WHERE shop_product_variants.product_id = excluded.product_id`,
    )
    .bind(
      id,
      productId,
      label,
      sku,
      JSON.stringify(options),
      stockQuantity,
      isAvailable ? 1 : 0,
      sortOrder,
      new Date().toISOString(),
    )
    .run();

  const variant = await fetchVariant(db, id);
  return jsonOk({ variant: variant ? rowToAdminShopVariant(variant) : null });
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await readJson<{ id?: unknown }>(request);
  const id = text(body?.id);
  if (!id) return jsonError("Variant id is required.", 422);
  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);
  await db.prepare(`DELETE FROM shop_product_variants WHERE id = ?`).bind(id).run();
  return jsonOk({ id });
}
