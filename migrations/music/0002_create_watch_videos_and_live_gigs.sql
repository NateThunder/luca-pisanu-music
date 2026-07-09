CREATE TABLE IF NOT EXISTS watch_videos (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  note TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_watch_videos_visible_sort
  ON watch_videos (is_visible, sort_order, title);

INSERT OR IGNORE INTO watch_videos (
  id,
  title,
  note,
  youtube_url,
  sort_order,
  is_visible
) VALUES (
  'no-time-for-love',
  'No Time For Love',
  'Official Music Video',
  'https://www.youtube.com/watch?v=WmWasQXIhi0',
  10,
  1
);

CREATE TABLE IF NOT EXISTS live_gigs (
  id TEXT PRIMARY KEY NOT NULL,
  event TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  starts_date TEXT NOT NULL,
  starts_time TEXT NOT NULL,
  timezone TEXT NOT NULL,
  ticket_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_live_gigs_visible_sort
  ON live_gigs (is_visible, sort_order, starts_date, starts_time);
