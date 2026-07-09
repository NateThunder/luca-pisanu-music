import { inquiryTypes, type InquiryType } from "@/data/site";
import {
  getRemoteIp,
  hashIp,
  text,
  verifyTurnstile,
} from "@/lib/comments";
import {
  createContactMessageAndSubscriber,
  getMailingListDatabase,
} from "@/lib/mailing-list";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  type?: unknown;
  message?: unknown;
  company?: unknown;
  turnstileToken?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTypes = new Set(inquiryTypes.map((item) => item.value));

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  let body: ContactPayload;

  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return Response.json(
      { ok: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  if (text(body.company)) {
    return Response.json({ ok: true });
  }

  const name = text(body.name);
  const email = text(body.email);
  const type = text(body.type) as InquiryType;
  const message = text(body.message);
  const turnstileToken = text(body.turnstileToken);
  const errors: Record<string, string> = {};

  if (name.length < 2 || name.length > 100) {
    errors.name = "Please enter a name between 2 and 100 characters.";
  }
  if (!emailPattern.test(email) || email.length > 254) {
    errors.email = "Please enter a valid email address.";
  }
  if (!allowedTypes.has(type)) {
    errors.type = "Please select a valid enquiry type.";
  }
  if (message.length < 20 || message.length > 5000) {
    errors.message = "Please enter a message between 20 and 5000 characters.";
  }

  if (Object.keys(errors).length) {
    return Response.json(
      {
        ok: false,
        message: "Check the highlighted fields.",
        errors,
      },
      { status: 422 },
    );
  }

  const remoteIp = getRemoteIp(request);

  try {
    const verified = await verifyTurnstile(turnstileToken, remoteIp);
    if (!verified) {
      return Response.json(
        {
          ok: false,
          message: "Verification failed. Please refresh and try again.",
        },
        { status: 403 },
      );
    }
  } catch {
    return Response.json(
      {
        ok: false,
        message: "Verification is temporarily unavailable.",
      },
      { status: 503 },
    );
  }

  const db = await getMailingListDatabase();
  if (!db) {
    return Response.json(
      {
        ok: false,
        message: "Mailing list database is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    await createContactMessageAndSubscriber(db, {
      id: crypto.randomUUID(),
      name,
      email,
      emailNormalized: email.toLowerCase(),
      inquiryType: type,
      message,
      ipHash: await hashIp(remoteIp),
    });
  } catch {
    return Response.json(
      {
        ok: false,
        message: "The message could not be saved. Please try again.",
      },
      { status: 502 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL ?? "lucapisanumusic@gmail.com";

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      return Response.json({ ok: true, development: true });
    }
    return Response.json(
      {
        ok: false,
        message: "Email delivery is not configured.",
      },
      { status: 503 },
    );
  }

  const typeLabel =
    inquiryTypes.find((item) => item.value === type)?.label ?? type;
  const idempotencyKey = crypto.randomUUID();
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `[Luca Pisanu website] ${typeLabel} enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nType: ${typeLabel}\n\n${message}`,
      html: `
        <h2>New ${escapeHtml(typeLabel)} enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Type:</strong> ${escapeHtml(typeLabel)}</p>
        <hr />
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
      tags: [{ name: "source", value: "luca-website" }],
    }),
  });

  if (!emailResponse.ok) {
    return Response.json(
      {
        ok: false,
        message: "The message could not be delivered. Please try again.",
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
