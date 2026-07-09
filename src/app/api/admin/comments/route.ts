import { requireAdmin } from "@/lib/admin-auth";
import { idFromRequestUrl, jsonError, jsonOk, readJson } from "@/lib/admin-route-utils";
import { getCommentsDatabase } from "@/lib/comments";

export const dynamic = "force-dynamic";

type AdminCommentRow = {
  id: string;
  screen_name: string;
  body: string;
  email: string;
  email_normalized: string;
  ip_hash: string;
  is_visible: number;
  created_at: string;
};

type VisibilityBody = {
  id?: unknown;
  isVisible?: unknown;
};

function rowToAdminComment(row: AdminCommentRow) {
  return {
    id: row.id,
    screenName: row.screen_name,
    body: row.body,
    email: row.email,
    emailNormalized: row.email_normalized,
    ipHash: row.ip_hash,
    isVisible: row.is_visible === 1,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getCommentsDatabase();
  if (!db) return jsonError("Comments database is not configured.", 503);

  const result = await db
    .prepare(
      `SELECT id,
              screen_name,
              body,
              email,
              email_normalized,
              ip_hash,
              is_visible,
              created_at
       FROM comments
       ORDER BY created_at DESC
       LIMIT 250`,
    )
    .all<AdminCommentRow>();

  return jsonOk({
    comments: (result.results ?? []).map(rowToAdminComment),
  });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await readJson<VisibilityBody>(request);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const isVisible = body?.isVisible === true;

  if (!id) return jsonError("Comment id is required.", 422, { id: "Required." });

  const db = await getCommentsDatabase();
  if (!db) return jsonError("Comments database is not configured.", 503);

  await db
    .prepare(`UPDATE comments SET is_visible = ? WHERE id = ?`)
    .bind(isVisible ? 1 : 0, id)
    .run();

  return jsonOk({ id, isVisible });
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getCommentsDatabase();
  if (!db) return jsonError("Comments database is not configured.", 503);

  const body = await readJson<{ id?: unknown }>(request);
  const bodyId = typeof body?.id === "string" ? body.id.trim() : "";
  const id = bodyId || idFromRequestUrl(request);
  if (!id) return jsonError("Comment id is required.", 422, { id: "Required." });

  await db.prepare(`DELETE FROM comments WHERE id = ?`).bind(id).run();

  return jsonOk({ id });
}
