import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, readJson, text } from "@/lib/admin-route-utils";
import { getShopDatabase } from "@/lib/shop-data";
import {
  sendShippingEmail,
  type ShopOrderItemRow,
  type ShopOrderRow,
  type ShopOrderWithItems,
} from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

async function fetchOrder(db: D1Database, id: string) {
  const order = await db
    .prepare(`SELECT * FROM shop_orders WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<ShopOrderRow>();
  if (!order) return null;
  const items = await db
    .prepare(`SELECT * FROM shop_order_items WHERE order_id = ? ORDER BY created_at ASC`)
    .bind(id)
    .all<ShopOrderItemRow>();
  return { ...order, items: items.results ?? [] };
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);
  const ordersResult = await db
    .prepare(`SELECT * FROM shop_orders ORDER BY created_at DESC LIMIT 200`)
    .all<ShopOrderRow>();
  const orders = ordersResult.results ?? [];
  if (!orders.length) return jsonOk({ orders: [] });
  const itemsResult = await db
    .prepare(
      `SELECT * FROM shop_order_items
       WHERE order_id IN (${orders.map(() => "?").join(", ")})
       ORDER BY created_at ASC`,
    )
    .bind(...orders.map((order) => order.id))
    .all<ShopOrderItemRow>();
  const items = itemsResult.results ?? [];
  return jsonOk({
    orders: orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.id),
    })),
  });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await readJson<{
    id?: unknown;
    action?: unknown;
    carrier?: unknown;
    trackingNumber?: unknown;
  }>(request);
  if (!body || body.action !== "ship") return jsonError("Invalid request.", 400);
  const id = text(body.id);
  const carrier = text(body.carrier);
  const trackingNumber = text(body.trackingNumber);
  if (!id || !carrier || !trackingNumber || carrier.length > 100 || trackingNumber.length > 150) {
    return jsonError("Carrier and tracking number are required.", 422);
  }
  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);
  const order = await fetchOrder(db, id);
  if (!order) return jsonError("Order not found.", 404);
  if (order.status !== "paid") return jsonError("Only paid orders can be shipped.", 409);
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE shop_orders
       SET fulfillment_status = 'shipped', tracking_carrier = ?, tracking_number = ?,
           shipped_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(carrier, trackingNumber, now, now, id)
    .run();
  const updated = (await fetchOrder(db, id)) as ShopOrderWithItems;
  try {
    await sendShippingEmail(db, updated);
  } catch {
    return jsonOk({ order: updated, emailWarning: true });
  }
  return jsonOk({ order: await fetchOrder(db, id) });
}
