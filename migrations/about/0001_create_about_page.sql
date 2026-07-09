CREATE TABLE IF NOT EXISTS about_pages (
  id TEXT PRIMARY KEY NOT NULL,
  eyebrow TEXT NOT NULL,
  heading TEXT NOT NULL,
  highlight_text TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS about_body_blocks (
  id TEXT PRIMARY KEY NOT NULL,
  page_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (page_id) REFERENCES about_pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_about_pages_published
  ON about_pages (is_published, id);

CREATE INDEX IF NOT EXISTS idx_about_body_blocks_page_sort
  ON about_body_blocks (page_id, sort_order);

INSERT OR REPLACE INTO about_pages (
  id,
  eyebrow,
  heading,
  highlight_text,
  is_published
) VALUES (
  'about',
  'The artist',
  'About',
  '"I''m a dot in the middle of nothing, but in my nothing I can achieve everything."',
  1
);

DELETE FROM about_body_blocks WHERE page_id = 'about';

INSERT INTO about_body_blocks (
  id,
  page_id,
  sort_order,
  body
) VALUES
  (
    'about-intro',
    'about',
    10,
    'Luca Pisanu is a singer-songwriter, composer, producer and multi-instrumentalist based in Glasgow, UK.'
  ),
  (
    'about-early-guitar',
    'about',
    20,
    'Drawn to music from an early age, he began playing guitar at eight. That first instrument set him on a journey through a wide range of genres and turned a childhood passion into his life''s focus.'
  ),
  (
    'about-influences',
    'about',
    30,
    'Influenced by artists including Stevie Wonder, Stevie Ray Vaughan and Jimi Hendrix, Luca creates eclectic, deeply expressive music rooted in blues, soul, jazz, funk and neo-soul.'
  ),
  (
    'about-solo-career',
    'about',
    40,
    'After performing with several projects across the UK, Italy and France, Luca began exploring his solo career and developing the groovy, suave sound that has come to define his work.'
  ),
  (
    'about-session-work',
    'about',
    50,
    'His wider work has included playing bass for Tom McGuire and the Brassholes, guitar for Charlotte Marshall and the 45s, and working as an in-demand session musician in Glasgow.'
  ),
  (
    'about-close',
    'about',
    60,
    'Warm vocals, melodic guitars and engaging bass lines make Luca Pisanu an artist to watch.'
  );
