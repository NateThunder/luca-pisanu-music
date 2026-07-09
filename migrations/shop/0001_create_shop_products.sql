CREATE TABLE IF NOT EXISTS shop_products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  note TEXT NOT NULL,
  description TEXT NOT NULL,
  price_gbp INTEGER NOT NULL,
  price_eur INTEGER NOT NULL,
  price_usd INTEGER NOT NULL,
  status TEXT NOT NULL,
  artwork TEXT NOT NULL CHECK (artwork IN ('vinyl', 'book', 'shirt', 'session')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_shop_products_active_category_sort
  ON shop_products (is_active, category_slug, sort_order, name);

INSERT OR REPLACE INTO shop_products (
  id,
  name,
  category,
  category_slug,
  note,
  description,
  price_gbp,
  price_eur,
  price_usd,
  status,
  artwork,
  sort_order,
  is_active
) VALUES
  (
    'limited-vinyl',
    'Limited Edition Vinyl',
    'Music',
    'music',
    'A numbered physical pressing with artwork insert.',
    'A demo pressing concept for Luca''s physical releases, built around numbered stock, tactile artwork and a small-run collector feel.',
    32,
    38,
    42,
    'Demo stock / opening soon',
    'vinyl',
    10,
    1
  ),
  (
    'guitar-notes',
    'Guitar Notes Vol. 01',
    'Education',
    'education',
    'Exercises, chord language and creative prompts from Luca''s lessons.',
    'A prototype printed workbook for players who want Luca''s lesson language in a practical format: voicings, rhythm ideas, prompts and short studies.',
    18,
    22,
    24,
    'Prototype product',
    'book',
    20,
    1
  ),
  (
    'artist-shirt',
    'LP Artist Shirt',
    'Merchandise',
    'merchandise',
    'Heavyweight black cotton with a distressed two-colour print.',
    'A merch concept using Luca''s stripped-back poster language on a heavyweight black shirt with a worn-in stage-ready finish.',
    26,
    31,
    34,
    'Demo sizing / opening soon',
    'shirt',
    30,
    1
  ),
  (
    'remote-session',
    'Remote Guitar Session',
    'Studio',
    'studio',
    'A custom recorded guitar part shaped around your song.',
    'A demo booking product for remote guitar parts, arrangement ideas or texture passes recorded for your track and shaped through direct conversation.',
    95,
    112,
    125,
    'Enquiry-led demo service',
    'session',
    40,
    1
  );
