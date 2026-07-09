CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY NOT NULL,
  screen_name TEXT NOT NULL,
  body TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_visible_created
  ON comments (is_visible, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_email_created
  ON comments (email_normalized, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_ip_hash_created
  ON comments (ip_hash, created_at);
