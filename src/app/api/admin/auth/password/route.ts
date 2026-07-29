import {
  changeAdminPassword,
  destroyAdminSession,
  getAdminSession,
  requireAdmin,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const session = await getAdminSession(request);
  if (!session) return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });

  let body: { currentPassword?: unknown; nextPassword?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const nextPassword = typeof body.nextPassword === "string" ? body.nextPassword : "";
  const result = await changeAdminPassword(session, currentPassword, nextPassword);
  if (result.ok) await destroyAdminSession(request);

  return Response.json(result, {
    status: result.ok ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}
