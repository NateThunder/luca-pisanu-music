import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return Response.json(
      { ok: true, authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { ok: true, authenticated: true, email: session.email, role: session.role, csrfToken: session.csrfToken },
    { headers: { "Cache-Control": "no-store" } },
  );
}
