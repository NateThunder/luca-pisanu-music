import { PayPalError } from "@/lib/paypal";
import {
  CheckoutValidationError,
  consumeCheckoutRateLimit,
  createCheckoutOrder,
  hasValidCheckoutOrigin,
} from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await hasValidCheckoutOrigin(request))) {
    return Response.json(
      { ok: false, message: "Request verification failed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!(await consumeCheckoutRateLimit(request))) {
    return Response.json(
      { ok: false, message: "Too many checkout attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": "600", "Cache-Control": "no-store" } },
    );
  }

  let body: { cart?: unknown; address?: unknown; orderMessage?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, message: "Invalid checkout request." }, { status: 400 });
  }

  try {
    const order = await createCheckoutOrder(request, body.cart, body.address, body.orderMessage);
    return Response.json({ ok: true, ...order }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return Response.json(
        {
          ok: false,
          message: error.message,
          unavailableProductIds: error.unavailableProductIds,
        },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (error instanceof PayPalError) {
      return Response.json(
        { ok: false, message: "PayPal could not start checkout. Please try again." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { ok: false, message: "Checkout is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
