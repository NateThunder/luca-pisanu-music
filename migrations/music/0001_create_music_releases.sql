CREATE TABLE IF NOT EXISTS music_releases (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  artwork TEXT NOT NULL CHECK (artwork IN ('portrait', 'tower', 'guitar', 'waves')),
  cover_art_key TEXT,
  audio_key TEXT,
  listen_url TEXT,
  support_url TEXT,
  spotify_url TEXT,
  apple_music_url TEXT,
  youtube_url TEXT,
  soundcloud_url TEXT,
  bandcamp_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_music_releases_published_sort
  ON music_releases (is_published, sort_order, title);

INSERT OR REPLACE INTO music_releases (
  id,
  title,
  description,
  artwork,
  listen_url,
  support_url,
  sort_order,
  is_published
) VALUES
  (
    'all-in-good-time',
    'All In Good Time',
    'A soulful journey through groove, melody and late-night thoughts.',
    'portrait',
    NULL,
    NULL,
    10,
    1
  ),
  (
    'keep-climbing',
    'Keep Climbing',
    'An uplifting mix of soul, funk and forward motion.',
    'tower',
    NULL,
    NULL,
    20,
    1
  ),
  (
    'half-light',
    'Half Light',
    'Intimate, raw and made in the in-between.',
    'guitar',
    NULL,
    NULL,
    30,
    1
  ),
  (
    'through-the-static',
    'Through The Static',
    'Textures, tension and release for wandering minds.',
    'waves',
    NULL,
    NULL,
    40,
    1
  );
