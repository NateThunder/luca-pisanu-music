import { getCloudflareContext } from "@opennextjs/cloudflare";

async function getCloudflareSecret(name: keyof CloudflareEnv) {
  try {
    const context = await getCloudflareContext({ async: true });
    const value = context.env[name];
    return typeof value === "string" ? value.trim() : "";
  } catch {
    return "";
  }
}

export async function getAdminToken() {
  const cloudflareToken =
    (await getCloudflareSecret("ADMIN_TOKEN")) ||
    (await getCloudflareSecret("MUSIC_ADMIN_TOKEN"));

  return (
    cloudflareToken ||
    process.env.ADMIN_TOKEN?.trim() ||
    process.env.MUSIC_ADMIN_TOKEN?.trim() ||
    ""
  );
}

function timingSafeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

function bearerToken(request: Request) {
  return request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
}

export async function authorizeAdminRequest(request: Request) {
  const adminToken = await getAdminToken();
  const suppliedToken = bearerToken(request);

  return Boolean(
    adminToken &&
      suppliedToken &&
      timingSafeEqual(suppliedToken, adminToken),
  );
}

export async function requireAdmin(request: Request) {
  if (await authorizeAdminRequest(request)) return null;

  return Response.json(
    { ok: false, message: "Unauthorized." },
    { status: 401 },
  );
}
