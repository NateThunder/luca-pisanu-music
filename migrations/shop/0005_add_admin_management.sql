ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('owner', 'admin'));
ALTER TABLE admin_users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1
  CHECK (is_active IN (0, 1));
ALTER TABLE admin_users ADD COLUMN invited_by TEXT;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  target_user_id TEXT,
  target_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('invite', 'resend_invitation', 'disable', 'enable', 'remove')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (actor_user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created
  ON admin_audit_log (created_at DESC);
