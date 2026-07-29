import {
  consumeAdminRateLimit,
  createPasswordReset,
  hasValidAdminOrigin,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await hasValidAdminOrigin(request))) {
    return Response.json({ ok: false, message: "Request verification failed." }, { status: 403 });
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const allowed = await consumeAdminRateLimit(
    request,
    "password-reset",
    email,
    3,
    60 * 60 * 1000,
  );
  if (allowed && email) {
    try {
      await createPasswordReset(email);
    } catch (error) {
      console.error("Admin password reset email delivery failed.", error);
      // Keep this response generic so account and provider state are not disclosed.
    }
  }

  return Response.json(
    { ok: true, message: "If the address matches the administrator, a reset link has been sent." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
