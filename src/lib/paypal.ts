import { getRuntimeValue } from "./runtime-env";

type PayPalEnvironment = "live" | "sandbox";

export class PayPalError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

async function configuration() {
  const environment: PayPalEnvironment =
    (await getRuntimeValue("PAYPAL_ENVIRONMENT")).toLowerCase() === "sandbox"
      ? "sandbox"
      : "live";
  const clientId = await getRuntimeValue("PAYPAL_CLIENT_ID");
  const clientSecret = await getRuntimeValue("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured.");

  return {
    environment,
    clientId,
    clientSecret,
    baseUrl:
      environment === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  };
}

export async function getPayPalPublicConfiguration() {
  const config = await configuration();
  return { clientId: config.clientId, environment: config.environment };
}

async function accessToken() {
  const config = await configuration();
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(12_000),
  });
  const data = (await response.json().catch(() => null)) as { access_token?: string } | null;
  if (!response.ok || !data?.access_token) {
    throw new PayPalError("PayPal authentication failed.", response.status);
  }
  return { config, token: data.access_token };
}

async function paypalRequest<T>(
  path: string,
  init: RequestInit,
  requestId?: string,
): Promise<T> {
  const { config, token } = await accessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  if (requestId) headers.set("PayPal-Request-Id", requestId.slice(0, 108));

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok || !data) {
    throw new PayPalError("PayPal could not process the request.", response.status, data);
  }
  return data;
}

export type PayPalOrderResponse = {
  id: string;
  status: string;
  payer?: { payer_id?: string; email_address?: string };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
};

export async function createPayPalOrder(payload: unknown, requestId: string) {
  return await paypalRequest<PayPalOrderResponse>(
    "/v2/checkout/orders",
    { method: "POST", body: JSON.stringify(payload) },
    requestId,
  );
}

export async function capturePayPalOrder(orderId: string, requestId: string) {
  return await paypalRequest<PayPalOrderResponse>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    { method: "POST", body: "{}" },
    requestId,
  );
}

export async function getPayPalOrder(orderId: string) {
  return await paypalRequest<PayPalOrderResponse>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    { method: "GET" },
  );
}

export async function verifyPayPalWebhook(
  headers: Headers,
  webhookEvent: unknown,
) {
  const webhookId = await getRuntimeValue("PAYPAL_WEBHOOK_ID");
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID is not configured.");

  const response = await paypalRequest<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    },
  );
  return response.verification_status === "SUCCESS";
}
