import { destroyAdminSession, requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  await destroyAdminSession(request);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
