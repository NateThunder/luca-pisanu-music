import { getAdminSession, requireOwner } from "@/lib/admin-auth";
import {
  inviteAdmin,
  listAdminAccounts,
  removeAdmin,
  resendAdminInvitation,
  setAdminActive,
} from "@/lib/admin-management";
import { jsonError, jsonOk, readJson, text } from "@/lib/admin-route-utils";

export const dynamic = "force-dynamic";

async function owner(request: Request) {
  const unauthorized = await requireOwner(request);
  if (unauthorized) return { response: unauthorized, session: null };
  return { response: null, session: await getAdminSession(request) };
}

export async function GET(request: Request) {
  const auth = await owner(request);
  if (auth.response) return auth.response;
  return jsonOk(await listAdminAccounts(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await owner(request);
  if (auth.response) return auth.response;
  const body = await readJson<{ email?: unknown }>(request);
  if (!body || !auth.session) return jsonError("Invalid request.", 400);
  const result = await inviteAdmin(auth.session, text(body.email));
  return result.ok ? jsonOk(result) : jsonError(result.message, 422);
}

export async function PATCH(request: Request) {
  const auth = await owner(request);
  if (auth.response) return auth.response;
  const body = await readJson<{ id?: unknown; action?: unknown }>(request);
  if (!body || !auth.session) return jsonError("Invalid request.", 400);
  const id = text(body.id);
  const action = text(body.action);
  const result = action === "resend"
    ? await resendAdminInvitation(auth.session, id)
    : action === "enable"
      ? await setAdminActive(auth.session, id, true)
      : action === "disable"
        ? await setAdminActive(auth.session, id, false)
        : { ok: false as const, message: "Unknown action." };
  return result.ok ? jsonOk(result) : jsonError(result.message, 422);
}

export async function DELETE(request: Request) {
  const auth = await owner(request);
  if (auth.response) return auth.response;
  const body = await readJson<{ id?: unknown }>(request);
  if (!body || !auth.session) return jsonError("Invalid request.", 400);
  const result = await removeAdmin(auth.session, text(body.id));
  return result.ok ? jsonOk(result) : jsonError(result.message, 422);
}
