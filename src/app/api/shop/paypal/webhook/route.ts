import { verifyPayPalWebhook } from "@/lib/paypal";
import { getShopDatabase } from "@/lib/shop-data";
import {
  finalizePaidOrder,
  getOrderByCaptureId,
  getOrderByPayPalId,
} from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

type WebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, unknown>;
};

const supportedEvents = new Set([
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DECLINED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
  "CUSTOMER.DISPUTE.CREATED",
  "CUSTOMER.DISPUTE.UPDATED",
  "CUSTOMER.DISPUTE.RESOLVED",
]);

function object(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!rawBody || rawBody.length > 1_000_000) {
    return Response.json({ ok: false }, { status: 400 });
  }
  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!event.id || !event.event_type || !(await verifyPayPalWebhook(request.headers, event))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (!supportedEvents.has(event.event_type)) {
    return Response.json({ ok: true });
  }

  const db = await getShopDatabase();
  if (!db) return Response.json({ ok: false }, { status: 503 });
  const duplicate = await db
    .prepare(`SELECT event_id FROM shop_paypal_events WHERE event_id = ? LIMIT 1`)
    .bind(event.id)
    .first<{ event_id: string }>();
  if (duplicate) return Response.json({ ok: true });

  const resource = event.resource ?? {};
  const supplementary = object(resource.supplementary_data);
  const relatedIds = object(supplementary?.related_ids);
  const paypalOrderId = text(relatedIds?.order_id);
  const captureId = text(resource.id);

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" && paypalOrderId && captureId) {
    const order = await getOrderByPayPalId(db, paypalOrderId);
    const amount = object(resource.amount);
    if (
      order &&
      text(resource.status) === "COMPLETED" &&
      text(amount?.currency_code) === order.currency &&
      text(amount?.value) === (order.total_minor / 100).toFixed(2)
    ) {
      await finalizePaidOrder(db, order, captureId, null);
    }
  } else if (
    ["PAYMENT.CAPTURE.DECLINED", "PAYMENT.CAPTURE.DENIED"].includes(event.event_type) &&
    paypalOrderId
  ) {
    await db
      .prepare(
        `UPDATE shop_orders SET status = 'payment_failed', updated_at = ?
         WHERE paypal_order_id = ? AND status = 'pending_payment'`,
      )
      .bind(new Date().toISOString(), paypalOrderId)
      .run();
  } else if (
    ["PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED"].includes(event.event_type)
  ) {
    const relatedCaptureId = text(relatedIds?.capture_id) || text(resource.invoice_id) || captureId;
    const order = relatedCaptureId ? await getOrderByCaptureId(db, relatedCaptureId) : null;
    if (order) {
      const refundAmount = object(resource.amount);
      const isFullRefund =
        text(refundAmount?.currency_code) === order.currency &&
        text(refundAmount?.value) === (order.total_minor / 100).toFixed(2);
      const status = event.event_type === "PAYMENT.CAPTURE.REVERSED"
        ? "reversed"
        : isFullRefund
          ? "refunded"
          : "partially_refunded";
      await db
        .prepare(`UPDATE shop_orders SET status = ?, updated_at = ? WHERE id = ?`)
        .bind(status, new Date().toISOString(), order.id)
        .run();
    }
  } else if (event.event_type.startsWith("CUSTOMER.DISPUTE.")) {
    const disputed = Array.isArray(resource.disputed_transactions)
      ? object(resource.disputed_transactions[0])
      : null;
    const disputedCaptureId = text(disputed?.seller_transaction_id);
    const order = disputedCaptureId ? await getOrderByCaptureId(db, disputedCaptureId) : null;
    if (order) {
      const status = event.event_type === "CUSTOMER.DISPUTE.RESOLVED"
        ? "dispute_resolved"
        : "disputed";
      await db
        .prepare(`UPDATE shop_orders SET status = ?, updated_at = ? WHERE id = ?`)
        .bind(status, new Date().toISOString(), order.id)
        .run();
    }
  }

  await db
    .prepare(
      `INSERT OR IGNORE INTO shop_paypal_events (
         event_id, event_type, paypal_order_id, paypal_capture_id
       ) VALUES (?, ?, ?, ?)`,
    )
    .bind(event.id, event.event_type, paypalOrderId || null, captureId || null)
    .run();
  return Response.json({ ok: true });
}
