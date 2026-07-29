import {
  consumeAdminRateLimit,
  createAdminSession,
  ensureAdminUser,
  hasValidAdminOrigin,
  verifyPassword,
} from "@/lib/admin-auth";
import { getShopDatabase } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type LoginBody = { email?: unknown; password?: unknown };

export async function POST(request: Request) {
  if (!(await hasValidAdminOrigin(request))) {
    return Response.json(
      { ok: false, message: "Request verification failed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const allowed = await consumeAdminRateLimit(request, "login", email, 5, 15 * 60 * 1000);
  if (!allowed) {
    return Response.json(
      { ok: false, message: "Too many attempts. Try again later." },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "900" } },
    );
  }

  const db = await getShopDatabase();
  if (!db) {
    return Response.json({ ok: false, message: "Admin is unavailable." }, { status: 503 });
  }
  await ensureAdminUser(db);
  const user = await db
    .prepare(
      `SELECT id, email, password_hash, session_version, role, is_active
       FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1`,
    )
    .bind(email)
    .first<Parameters<typeof createAdminSession>[0]>();
  const valid =
    Boolean(user) &&
    password.length <= 128 &&
    (await verifyPassword(password, user?.password_hash ?? null));
  if (!valid) {
    return Response.json(
      { ok: false, message: "Invalid email or password." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const csrfToken = await createAdminSession(user!);
  return Response.json(
    { ok: true, email: user!.email, role: user!.role, csrfToken },
    { headers: { "Cache-Control": "no-store" } },
  );
}
