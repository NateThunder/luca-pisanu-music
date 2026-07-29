import { hasValidAdminOrigin, resetAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await hasValidAdminOrigin(request))) {
    return Response.json({ ok: false, message: "Request verification failed." }, { status: 403 });
  }

  let body: { token?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) {
    return Response.json({ ok: false, message: "This reset link is invalid or expired." }, { status: 422 });
  }

  const result = await resetAdminPassword(token, password);
  return Response.json(result, {
    status: result.ok ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}
