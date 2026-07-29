import { getPayPalPublicConfiguration } from "@/lib/paypal";
import { currencyForCountry, requestCountry } from "@/lib/shop-orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const config = await getPayPalPublicConfiguration();
    return Response.json(
      {
        ok: true,
        clientId: config.clientId,
        environment: config.environment === "live" ? "production" : "sandbox",
        currency: currencyForCountry(requestCountry(request)),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, message: "Payments are not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
