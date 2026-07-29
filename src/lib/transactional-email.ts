import { getRuntimeValue } from "./runtime-env";

type EmailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey: string;
  tag: string;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransactionalEmail(message: EmailMessage) {
  const apiKey = await getRuntimeValue("RESEND_API_KEY");
  const from = await getRuntimeValue("RESEND_FROM_EMAIL");

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") return { development: true };
    throw new Error("Email delivery is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      subject: message.subject,
      text: message.text,
      html: message.html,
      tags: [{ name: "source", value: message.tag }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}.`);
  }

  return { development: false };
}
