CREATE TABLE IF NOT EXISTS home_page_media (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'home'),
  banner_image_key TEXT,
  banner_desktop_x REAL NOT NULL DEFAULT 66,
  banner_desktop_y REAL NOT NULL DEFAULT 50,
  banner_desktop_zoom REAL NOT NULL DEFAULT 1,
  banner_mobile_x REAL NOT NULL DEFAULT 48,
  banner_mobile_y REAL NOT NULL DEFAULT 50,
  banner_mobile_zoom REAL NOT NULL DEFAULT 1,
  connect_image_key TEXT,
  connect_desktop_x REAL NOT NULL DEFAULT 50,
  connect_desktop_y REAL NOT NULL DEFAULT 15,
  connect_desktop_zoom REAL NOT NULL DEFAULT 1,
  connect_mobile_x REAL NOT NULL DEFAULT 50,
  connect_mobile_y REAL NOT NULL DEFAULT 15,
  connect_mobile_zoom REAL NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO home_page_media (id) VALUES ('home');
