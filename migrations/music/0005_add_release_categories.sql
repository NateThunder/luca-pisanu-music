ALTER TABLE music_releases ADD COLUMN release_type TEXT NOT NULL DEFAULT 'SINGLE'
  CHECK (release_type IN ('ALBUM', 'EP', 'SINGLE'));

