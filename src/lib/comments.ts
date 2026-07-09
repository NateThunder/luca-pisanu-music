import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PublicComment } from "@/data/comments";
import { prepareMailingListSubscriberUpsert } from "@/lib/mailing-list";

export type CommentPayload = {
  screenName?: unknown;
  email?: unknown;
  comment?: unknown;
  company?: unknown;
  turnstileToken?: unknown;
};

export type CommentErrors = Partial<
  Record<"screenName" | "email" | "comment" | "turnstile" | "database", string>
>;

type CommentRow = {
  id: string;
  screen_name: string;
  body: string;
  created_at: string;
};

type CountRow = {
  count: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern =
  /(https?:\/\/|www\.|[a-z0-9-]+\.(?:com|net|org|io|co|uk|info|biz|xyz|app|dev)\b)/i;
const blockedTerms = [
  "casino",
  "crypto",
  "forex",
  "loan",
  "onlyfans",
  "porn",
  "telegram",
  "viagra",
  "whatsapp",
  "fuck",
  "shit",
];

export function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanInline(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function hasRepeatedNoise(value: string) {
  const compact = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (compact.length >= 12 && /^(.{1,4})\1{3,}$/.test(compact)) return true;

  const words = value.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 8) return false;

  const uniqueWords = new Set(words);
  return uniqueWords.size <= 2;
}

export function validateCommentPayload(payload: CommentPayload) {
  const screenName = cleanInline(text(payload.screenName));
  const email = cleanInline(text(payload.email));
  const emailNormalized = email.toLowerCase();
  const comment = cleanInline(text(payload.comment));
  const company = text(payload.company);
  const turnstileToken = text(payload.turnstileToken);
  const errors: CommentErrors = {};

  if (screenName.length < 2 || screenName.length > 40) {
    errors.screenName = "Use a screen name between 2 and 40 characters.";
  }

  if (!emailPattern.test(email) || email.length > 254) {
    errors.email = "Enter a valid email address.";
  }

  if (comment.length < 10 || comment.length > 280) {
    errors.comment = "Write between 10 and 280 characters.";
  } else if (urlPattern.test(comment)) {
    errors.comment = "Comments cannot include links.";
  } else if (hasRepeatedNoise(comment)) {
    errors.comment = "Write a more natural comment.";
  } else {
    const lowerComment = comment.toLowerCase();
    const blocked = blockedTerms.some((term) => lowerComment.includes(term));
    if (blocked) errors.comment = "That comment cannot be published.";
  }

  return {
    company,
    email,
    emailNormalized,
    errors,
    screenName,
    comment,
    turnstileToken,
  };
}

export async function getCommentsDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.DB ?? null;
  } catch {
    return null;
  }
}

export function rowToPublicComment(row: CommentRow): PublicComment {
  return {
    id: row.id,
    screenName: row.screen_name,
    body: row.body,
    createdAt: row.created_at,
    source: "live",
  };
}

export async function listVisibleComments(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id, screen_name, body, created_at
       FROM comments
       WHERE is_visible = 1
       ORDER BY created_at DESC
       LIMIT 24`,
    )
    .all<CommentRow>();

  return (result.results ?? []).map(rowToPublicComment);
}

export async function countRecentComments(
  db: D1Database,
  field: "email_normalized" | "ip_hash",
  value: string,
  sinceIso: string,
) {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM comments
       WHERE ${field} = ? AND created_at >= ?`,
    )
    .bind(value, sinceIso)
    .all<CountRow>();

  return Number(result.results?.[0]?.count ?? 0);
}

export async function createComment(
  db: D1Database,
  input: {
    body: string;
    email: string;
    emailNormalized: string;
    id: string;
    ipHash: string;
    screenName: string;
  },
) {
  const createdAt = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO comments (
        id,
        screen_name,
        body,
        email,
        email_normalized,
        ip_hash,
        is_visible,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      )
      .bind(
        input.id,
        input.screenName,
        input.body,
        input.email,
        input.emailNormalized,
        input.ipHash,
        createdAt,
      ),
    prepareMailingListSubscriberUpsert(db, {
      email: input.email,
      emailNormalized: input.emailNormalized,
      name: input.screenName,
      source: "comment",
      seenAt: createdAt,
    }),
  ]);

  return rowToPublicComment({
    id: input.id,
    screen_name: input.screenName,
    body: input.body,
    created_at: createdAt,
  });
}

export function getRemoteIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("cf-connecting-ip") ??
    forwardedFor?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function hashIp(remoteIp: string) {
  const contextSecret = await getCloudflareSecret("COMMENT_IP_HASH_SECRET");
  const secret =
    contextSecret ??
    process.env.COMMENT_IP_HASH_SECRET ??
    process.env.TURNSTILE_SECRET_KEY ??
    (process.env.NODE_ENV !== "production"
      ? "development-comment-hash-secret"
      : "");

  if (!secret) return null;

  const encoded = new TextEncoder().encode(`${secret}:${remoteIp}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyTurnstile(token: string, remoteIp: string) {
  const secret =
    (await getCloudflareSecret("TURNSTILE_SECRET_KEY")) ??
    process.env.TURNSTILE_SECRET_KEY;

  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: remoteIp === "unknown" ? undefined : remoteIp,
        idempotency_key: crypto.randomUUID(),
      }),
    },
  );

  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

async function getCloudflareSecret(name: keyof CloudflareEnv) {
  try {
    const context = await getCloudflareContext({ async: true });
    const value = context.env[name];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}
