import { CheckoutValidationError, consumeCheckoutRateLimit, createFreeCheckoutOrder, hasValidCheckoutOrigin } from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await hasValidCheckoutOrigin(request))) return Response.json({ ok: false, message: "Request verification failed." }, { status: 403 });
  if (!(await consumeCheckoutRateLimit(request))) return Response.json({ ok: false, message: "Too many checkout attempts. Please wait and try again." }, { status: 429 });
  try {
    const body = await request.json() as { cart?: unknown; address?: unknown; orderMessage?: unknown };
    const order = await createFreeCheckoutOrder(request, body.cart, body.address, body.orderMessage);
    return Response.json({ ok: true, ...order }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CheckoutValidationError) return Response.json({ ok: false, message: error.message, unavailableProductIds: error.unavailableProductIds }, { status: 422 });
    return Response.json({ ok: false, message: "The free download could not be prepared." }, { status: 503 });
  }
}
