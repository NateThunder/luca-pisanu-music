import {
  CheckoutValidationError,
  hasValidCheckoutOrigin,
  quoteCheckoutOrder,
} from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await hasValidCheckoutOrigin(request))) {
    return Response.json(
      { ok: false, message: "Request verification failed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  let body: { cart?: unknown; address?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json(
      { ok: false, message: "Invalid delivery request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const quote = await quoteCheckoutOrder(request, body.cart, body.address);
    return Response.json(
      { ok: true, ...quote },
      { headers: { "Cache-Control": "private, no-store" } },
    );
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
    return Response.json(
      { ok: false, message: "Delivery cannot be calculated right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
