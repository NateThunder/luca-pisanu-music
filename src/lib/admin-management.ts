import { createPasswordReset, ensureAdminUser, type AdminSession } from "./admin-auth";
import { getShopDatabase } from "./shop-data";

type AdminAccountRow = {
  id: string;
  email: string;
  role: "owner" | "admin";
  is_active: number;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
};

type AuditRow = {
  id: string;
  actor_email: string;
  target_email: string;
  action: string;
  created_at: string;
};

function account(row: AdminAccountRow) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    active: row.is_active === 1,
    passwordSet: Boolean(row.password_hash),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function audit(row: AuditRow) {
  return {
    id: row.id,
    actorEmail: row.actor_email,
    targetEmail: row.target_email,
    action: row.action,
    createdAt: row.created_at,
  };
}

async function database() {
  const db = await getShopDatabase();
  if (!db) throw new Error("Admin database is unavailable.");
  await ensureAdminUser(db);
  return db;
}

async function recordAudit(
  db: D1Database,
  actor: AdminSession,
  target: { id: string; email: string },
  action: AuditRow["action"],
) {
  await db
    .prepare(
      `INSERT INTO admin_audit_log
       (id, actor_user_id, actor_email, target_user_id, target_email, action)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), actor.userId, actor.email, target.id, target.email, action)
    .run();
}

export async function listAdminAccounts() {
  const db = await database();
  const [accountsResult, auditResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, email, role, is_active, password_hash, created_at, updated_at
         FROM admin_users ORDER BY role DESC, email ASC`,
      )
      .all<AdminAccountRow>(),
    db
      .prepare(
        `SELECT id, actor_email, target_email, action, created_at
         FROM admin_audit_log ORDER BY created_at DESC LIMIT 50`,
      )
      .all<AuditRow>(),
  ]);
  return {
    accounts: (accountsResult.results ?? []).map(account),
    audit: (auditResult.results ?? []).map(audit),
  };
}

export async function inviteAdmin(actor: AdminSession, rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false as const, message: "Enter a valid email address." };
  }
  const db = await database();
  const existing = await db
    .prepare(`SELECT id, email, role, is_active FROM admin_users WHERE email = ? LIMIT 1`)
    .bind(email)
    .first<{ id: string; email: string; role: string; is_active: number }>();
  if (existing) {
    return { ok: false as const, message: "That administrator already exists." };
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO admin_users (id, email, role, is_active, invited_by)
       VALUES (?, ?, 'admin', 1, ?)`,
    )
    .bind(id, email, actor.userId)
    .run();
  await recordAudit(db, actor, { id, email }, "invite");
  try {
    await createPasswordReset(email);
  } catch {
    return {
      ok: true as const,
      warning: "The account was added, but its invitation email could not be sent. Use Resend invitation.",
    };
  }
  return { ok: true as const };
}

export async function resendAdminInvitation(actor: AdminSession, id: string) {
  const db = await database();
  const target = await db
    .prepare(`SELECT id, email, role, is_active FROM admin_users WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string; email: string; role: string; is_active: number }>();
  if (!target || target.role === "owner") {
    return { ok: false as const, message: "Administrator not found." };
  }
  if (target.is_active !== 1) {
    return { ok: false as const, message: "Enable this administrator before resending an invitation." };
  }
  await createPasswordReset(target.email);
  await recordAudit(db, actor, target, "resend_invitation");
  return { ok: true as const };
}

export async function setAdminActive(actor: AdminSession, id: string, active: boolean) {
  const db = await database();
  const target = await db
    .prepare(`SELECT id, email, role, is_active FROM admin_users WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string; email: string; role: string; is_active: number }>();
  if (!target || target.role === "owner" || target.id === actor.userId) {
    return { ok: false as const, message: "This administrator cannot be changed." };
  }
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `UPDATE admin_users
         SET is_active = ?, session_version = session_version + 1, updated_at = ?
         WHERE id = ? AND role = 'admin'`,
      )
      .bind(active ? 1 : 0, now, target.id),
    db.prepare(`DELETE FROM admin_sessions WHERE user_id = ?`).bind(target.id),
  ]);
  await recordAudit(db, actor, target, active ? "enable" : "disable");
  return { ok: true as const };
}

export async function removeAdmin(actor: AdminSession, id: string) {
  const db = await database();
  const target = await db
    .prepare(`SELECT id, email, role FROM admin_users WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string; email: string; role: string }>();
  if (!target || target.role === "owner" || target.id === actor.userId) {
    return { ok: false as const, message: "This administrator cannot be removed." };
  }
  await recordAudit(db, actor, target, "remove");
  await db.prepare(`DELETE FROM admin_users WHERE id = ? AND role = 'admin'`).bind(target.id).run();
  return { ok: true as const };
}
