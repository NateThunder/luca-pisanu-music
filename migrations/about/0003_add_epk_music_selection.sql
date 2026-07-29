CREATE TABLE IF NOT EXISTS epk_music_selection (
  release_id TEXT PRIMARY KEY NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_epk_music_selection_sort
  ON epk_music_selection (sort_order, release_id);
