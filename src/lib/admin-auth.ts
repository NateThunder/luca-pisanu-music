import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { getShopDatabase } from "./shop-data";
import { getAppOrigin, getRuntimeValue } from "./runtime-env";
import { escapeHtml, sendTransactionalEmail } from "./transactional-email";

const SESSION_COOKIE = "luca_admin_session";
const SESSION_SECONDS = 12 * 60 * 60;
const PASSWORD_RESET_SECONDS = 30 * 60;
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  session_version: number;
  role: "owner" | "admin";
  is_active: number;
};

type AdminSessionRow = AdminUserRow & {
  token_hash: string;
  expires_at: string;
  last_seen_at: string;
};

export type AdminSession = {
  userId: string;
  email: string;
  role: "owner" | "admin";
  csrfToken: string;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function scrypt(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, SCRYPT_OPTIONS, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function validatePassword(password: string) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 128) return "Use no more than 128 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Include upper and lower-case letters.";
  }
  if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Include a number and a symbol.";
  }
  return null;
}

export async function hashPassword(password: string) {
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt);
  return `scrypt$32768$8$1$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string | null) {
  if (!encoded) {
    await scrypt(password.slice(0, 128), Buffer.alloc(16));
    return false;
  }

  const [algorithm, n, r, p, saltValue, hashValue] = encoded.split("$");
  if (
    algorithm !== "scrypt" ||
    n !== "32768" ||
    r !== "8" ||
    p !== "1" ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }

  const expected = Buffer.from(hashValue, "base64url");
  const actual = await scrypt(password.slice(0, 128), Buffer.from(saltValue, "base64url"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function sessionSecret() {
  const secret = await getRuntimeValue("ADMIN_SESSION_SECRET");
  if (secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== "production") return "local-development-session-secret-change-me";
  throw new Error("ADMIN_SESSION_SECRET is not configured.");
}

export async function configuredAdminEmail() {
  return (
    (await getRuntimeValue("ADMIN_EMAIL")) || "lucapisanumusic@gmail.com"
  ).toLowerCase();
}

export async function ensureAdminUser(db: D1Database) {
  const email = await configuredAdminEmail();
  let user = await db
    .prepare(
      `SELECT id, email, password_hash, session_version, role, is_active
       FROM admin_users WHERE email = ? LIMIT 1`,
    )
    .bind(email)
    .first<AdminUserRow>();

  if (!user) {
    const id = crypto.randomUUID();
    await db
      .prepare(`INSERT INTO admin_users (id, email, role, is_active) VALUES (?, ?, 'owner', 1)`)
      .bind(id, email)
      .run();
    user = { id, email, password_hash: null, session_version: 1, role: "owner", is_active: 1 };
  } else if (user.role !== "owner" || user.is_active !== 1) {
    await db
      .prepare(`UPDATE admin_users SET role = 'owner', is_active = 1, updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), user.id)
      .run();
    user = { ...user, role: "owner", is_active: 1 };
  }

  return user;
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return "";
      }
    }
  }
  return "";
}

async function csrfTokenFor(sessionToken: string) {
  return createHmac("sha256", await sessionSecret())
    .update(`csrf:${sessionToken}`)
    .digest("base64url");
}

export async function hasValidAdminOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set([new URL(request.url).origin, new URL(await getAppOrigin()).origin]);
  return allowed.has(origin);
}

export async function getAdminSession(request: Request): Promise<AdminSession | null> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;

  const db = await getShopDatabase();
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT admin_sessions.token_hash,
              admin_sessions.expires_at,
              admin_sessions.last_seen_at,
              admin_users.id,
              admin_users.email,
              admin_users.password_hash,
              admin_users.session_version,
              admin_users.role,
              admin_users.is_active
       FROM admin_sessions
       JOIN admin_users ON admin_users.id = admin_sessions.user_id
       WHERE admin_sessions.token_hash = ?
         AND admin_sessions.session_version = admin_users.session_version
         AND admin_users.is_active = 1
         AND admin_sessions.expires_at > ?
       LIMIT 1`,
    )
    .bind(sha256(token), new Date().toISOString())
    .first<AdminSessionRow>();

  if (!row) return null;

  if (Date.now() - new Date(row.last_seen_at).getTime() > 15 * 60 * 1000) {
    await db
      .prepare(`UPDATE admin_sessions SET last_seen_at = ? WHERE token_hash = ?`)
      .bind(new Date().toISOString(), row.token_hash)
      .run();
  }

  return {
    userId: row.id,
    email: row.email,
    role: row.role,
    csrfToken: await csrfTokenFor(token),
  };
}

export async function createAdminSession(user: AdminUserRow) {
  const db = await getShopDatabase();
  if (!db) throw new Error("Shop database is not configured.");

  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await db
    .prepare(
      `INSERT INTO admin_sessions (
         token_hash, user_id, session_version, expires_at, last_seen_at
       ) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      sha256(token),
      user.id,
      user.session_version,
      expiresAt.toISOString(),
      new Date().toISOString(),
    )
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
    priority: "high",
  });

  return await csrfTokenFor(token);
}

export async function destroyAdminSession(request: Request) {
  const token = cookieValue(request, SESSION_COOKIE);
  const db = await getShopDatabase();
  if (token && db) {
    await db
      .prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`)
      .bind(sha256(token))
      .run();
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}

export async function requireAdmin(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const suppliedCsrf = request.headers.get("x-csrf-token") ?? "";
    const expected = Buffer.from(session.csrfToken);
    const supplied = Buffer.from(suppliedCsrf);
    if (
      !(await hasValidAdminOrigin(request)) ||
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      return Response.json(
        { ok: false, message: "Request verification failed." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  return null;
}

export async function requireOwner(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const session = await getAdminSession(request);
  if (!session || session.role !== "owner") {
    return Response.json(
      { ok: false, message: "Owner access is required." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

function remoteAddress(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function consumeAdminRateLimit(
  request: Request,
  scope: "login" | "password-reset",
  key: string,
  maximum: number,
  windowMs: number,
) {
  const db = await getShopDatabase();
  if (!db) return false;

  const secret = await sessionSecret();
  const keyHash = createHmac("sha256", secret)
    .update(`${scope}:${remoteAddress(request)}:${key.toLowerCase()}`)
    .digest("hex");
  const now = new Date();
  const existing = await db
    .prepare(
      `SELECT window_started_at, attempt_count, blocked_until
       FROM admin_rate_limits WHERE scope = ? AND key_hash = ? LIMIT 1`,
    )
    .bind(scope, keyHash)
    .first<{
      window_started_at: string;
      attempt_count: number;
      blocked_until: string | null;
    }>();

  if (existing?.blocked_until && new Date(existing.blocked_until) > now) return false;

  const windowExpired =
    !existing || now.getTime() - new Date(existing.window_started_at).getTime() >= windowMs;
  const attemptCount = windowExpired ? 1 : existing.attempt_count + 1;
  const blockedUntil = attemptCount > maximum
    ? new Date(now.getTime() + windowMs).toISOString()
    : null;

  await db
    .prepare(
      `INSERT INTO admin_rate_limits (
         scope, key_hash, window_started_at, attempt_count, blocked_until
       ) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(scope, key_hash) DO UPDATE SET
         window_started_at = excluded.window_started_at,
         attempt_count = excluded.attempt_count,
         blocked_until = excluded.blocked_until`,
    )
    .bind(
      scope,
      keyHash,
      windowExpired ? now.toISOString() : existing.window_started_at,
      attemptCount,
      blockedUntil,
    )
    .run();

  return attemptCount <= maximum;
}

export async function createPasswordReset(email: string) {
  const db = await getShopDatabase();
  if (!db) throw new Error("Shop database is not configured.");

  await ensureAdminUser(db);
  const user = await db
    .prepare(
      `SELECT id, email, password_hash, session_version, role, is_active
       FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1`,
    )
    .bind(email.trim().toLowerCase())
    .first<AdminUserRow>();
  if (!user) return;

  const token = randomToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_SECONDS * 1000);
  await db.batch([
    db
      .prepare(`DELETE FROM admin_password_resets WHERE user_id = ?`)
      .bind(user.id),
    db
      .prepare(
        `INSERT INTO admin_password_resets (token_hash, user_id, expires_at)
         VALUES (?, ?, ?)`,
      )
      .bind(sha256(token), user.id, expiresAt.toISOString()),
  ]);

  const resetUrl = new URL("/admin/reset", await getAppOrigin());
  resetUrl.searchParams.set("token", token);
  await sendTransactionalEmail({
    to: user.email,
    subject: "Set or reset your Luca website admin password",
    text: `Use this link within 30 minutes to set a new admin password:\n\n${resetUrl.toString()}\n\nIf you did not request this, ignore this email.`,
    html: `<h2>Admin password reset</h2><p>Use the secure link below within 30 minutes to set a new password.</p><p><a href="${escapeHtml(resetUrl.toString())}">Set a new password</a></p><p>If you did not request this, ignore this email.</p>`,
    idempotencyKey: `admin-reset-${sha256(token)}`,
    tag: "admin-password-reset",
  });
}

export async function resetAdminPassword(token: string, password: string) {
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false as const, message: passwordError };

  const db = await getShopDatabase();
  if (!db) return { ok: false as const, message: "Admin database is unavailable." };

  const reset = await db
    .prepare(
      `SELECT token_hash, user_id
       FROM admin_password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
       LIMIT 1`,
    )
    .bind(sha256(token), new Date().toISOString())
    .first<{ token_hash: string; user_id: string }>();
  if (!reset) return { ok: false as const, message: "This reset link is invalid or expired." };

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const resetClaim = `${now}:${randomToken(8)}`;
  const results = await db.batch([
    db
      .prepare(
        `UPDATE admin_password_resets
         SET used_at = ?
         WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
      )
      .bind(resetClaim, reset.token_hash, now),
    db
      .prepare(
        `UPDATE admin_users
         SET password_hash = ?, session_version = session_version + 1, updated_at = ?
         WHERE id = ?
           AND EXISTS (
             SELECT 1 FROM admin_password_resets
             WHERE token_hash = ? AND used_at = ?
           )`,
      )
      .bind(passwordHash, now, reset.user_id, reset.token_hash, resetClaim),
    db
      .prepare(
        `DELETE FROM admin_sessions
         WHERE user_id = ?
           AND EXISTS (
             SELECT 1 FROM admin_password_resets
             WHERE token_hash = ? AND used_at = ?
           )`,
      )
      .bind(reset.user_id, reset.token_hash, resetClaim),
  ]);
  if ((results[0].meta.changes ?? 0) !== 1) {
    return { ok: false as const, message: "This reset link is invalid or expired." };
  }

  return { ok: true as const };
}

export async function changeAdminPassword(
  session: AdminSession,
  currentPassword: string,
  nextPassword: string,
) {
  const db = await getShopDatabase();
  if (!db) return { ok: false as const, message: "Admin database is unavailable." };
  const user = await db
    .prepare(
      `SELECT id, email, password_hash, session_version, role, is_active
       FROM admin_users WHERE id = ? LIMIT 1`,
    )
    .bind(session.userId)
    .first<AdminUserRow>();
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    return { ok: false as const, message: "The current password is incorrect." };
  }

  const passwordError = validatePassword(nextPassword);
  if (passwordError) return { ok: false as const, message: passwordError };

  const passwordHash = await hashPassword(nextPassword);
  await db.batch([
    db
      .prepare(
        `UPDATE admin_users
         SET password_hash = ?, session_version = session_version + 1, updated_at = ?
         WHERE id = ?`,
      )
      .bind(passwordHash, new Date().toISOString(), user.id),
    db.prepare(`DELETE FROM admin_sessions WHERE user_id = ?`).bind(user.id),
  ]);
  return { ok: true as const };
}
