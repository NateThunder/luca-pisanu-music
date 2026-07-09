CREATE TABLE IF NOT EXISTS shop_artworks (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  front_key TEXT NOT NULL,
  back_key TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_shop_artworks_sort
  ON shop_artworks (sort_order, title);

ALTER TABLE shop_products ADD COLUMN artwork_id TEXT;

CREATE INDEX IF NOT EXISTS idx_shop_products_artwork
  ON shop_products (artwork_id);
