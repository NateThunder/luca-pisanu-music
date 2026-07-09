CREATE TABLE IF NOT EXISTS music_artworks (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  image_key TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_music_artworks_sort
  ON music_artworks (sort_order, title);

ALTER TABLE music_releases ADD COLUMN artwork_id TEXT;

CREATE INDEX IF NOT EXISTS idx_music_releases_artwork
  ON music_releases (artwork_id);
