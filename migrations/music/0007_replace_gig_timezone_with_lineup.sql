ALTER TABLE live_gigs RENAME TO live_gigs_before_lineup;

CREATE TABLE live_gigs (
  id TEXT PRIMARY KEY NOT NULL,
  event TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  starts_date TEXT NOT NULL,
  starts_time TEXT NOT NULL,
  lineup_type TEXT
    CHECK (
      lineup_type IS NULL
      OR lineup_type IN ('SOLO', 'DUO', 'TRIO', 'QUARTET', 'FULL_BAND', 'OTHER')
    ),
  lineup_other TEXT,
  ticket_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO live_gigs (
  id,
  event,
  venue,
  location,
  starts_date,
  starts_time,
  lineup_type,
  lineup_other,
  ticket_url,
  sort_order,
  is_visible,
  created_at,
  updated_at
)
SELECT
  id,
  event,
  venue,
  location,
  starts_date,
  starts_time,
  NULL,
  NULL,
  ticket_url,
  sort_order,
  is_visible,
  created_at,
  updated_at
FROM live_gigs_before_lineup;

DROP TABLE live_gigs_before_lineup;

CREATE INDEX idx_live_gigs_visible_sort
  ON live_gigs (is_visible, sort_order, starts_date, starts_time);
