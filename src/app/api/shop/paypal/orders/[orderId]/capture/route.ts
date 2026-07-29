import { capturePayPalOrder, getPayPalOrder } from "@/lib/paypal";
import { getShopDatabase } from "@/lib/shop-data";
import { ensureOrderDownloads } from "@/lib/shop-downloads";
import { ensureOrderVideoAccess } from "@/lib/shop-video-downloads";
import {
  finalizePaidOrder,
  getOrderByPayPalId,
  hasValidCheckoutOrigin,
  sendOrderEmails,
  type ShopOrderWithItems,
  validateCompletedCapture,
} from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

async function paidOrderResponse(db: D1Database, order: ShopOrderWithItems) {
  await sendOrderEmails(db, order);
  const downloads = [
    ...(await ensureOrderDownloads(db, order.id)).map(({ format, original_filename, url }) => ({ format, originalFilename: original_filename, url, external: false })),
    ...(await ensureOrderVideoAccess(db, order.id)),
  ];
  return Response.json({
    ok: true,
    orderNumber: order.order_number,
    customerEmail: order.customer_email,
    status: "paid",
    downloads,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  if (!(await hasValidCheckoutOrigin(request))) {
    return Response.json(
      { ok: false, message: "Request verification failed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { orderId } = await context.params;
  if (!/^[A-Z0-9]{10,32}$/i.test(orderId)) {
    return Response.json({ ok: false, message: "Invalid PayPal order." }, { status: 400 });
  }
  const db = await getShopDatabase();
  if (!db) return Response.json({ ok: false, message: "Shop database is unavailable." }, { status: 503 });
  const order = await getOrderByPayPalId(db, orderId);
  if (!order) return Response.json({ ok: false, message: "Order not found." }, { status: 404 });
  if (order.status === "paid") {
    return paidOrderResponse(db, order);
  }
  if (order.status !== "pending_payment") {
    return Response.json({ ok: false, message: "This order cannot be captured." }, { status: 409 });
  }

  try {
    const response = await capturePayPalOrder(orderId, `${order.id}-capture`);
    const capture = validateCompletedCapture(order, response);
    const paid = await finalizePaidOrder(db, order, capture.id, response.payer?.payer_id);
    const downloads = [
      ...(await ensureOrderDownloads(db, paid.id)).map(({ format, original_filename, url }) => ({ format, originalFilename: original_filename, url, external: false })),
      ...(await ensureOrderVideoAccess(db, paid.id)),
    ];
    return Response.json(
      {
        ok: true,
        orderNumber: paid.order_number,
        customerEmail: paid.customer_email,
        status: paid.status,
        downloads,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    try {
      const response = await getPayPalOrder(orderId);
      const capture = validateCompletedCapture(order, response);
      const paid = await finalizePaidOrder(db, order, capture.id, response.payer?.payer_id);
      const downloads = [
        ...(await ensureOrderDownloads(db, paid.id)).map(({ format, original_filename, url }) => ({ format, originalFilename: original_filename, url, external: false })),
        ...(await ensureOrderVideoAccess(db, paid.id)),
      ];
      return Response.json(
        {
          ok: true,
          orderNumber: paid.order_number,
          customerEmail: paid.customer_email,
          status: paid.status,
          downloads,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      // A verified webhook can still reconcile the order if PayPal is temporarily unavailable.
    }
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const reconciled = await getOrderByPayPalId(db, orderId);
      if (reconciled?.status === "paid") return paidOrderResponse(db, reconciled);
    }
    return Response.json(
      {
        ok: false,
        message: "Payment status could not be confirmed. Do not pay again; check your confirmation email or contact Luca.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
