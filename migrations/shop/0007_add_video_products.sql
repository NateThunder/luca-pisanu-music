ALTER TABLE shop_products ADD COLUMN video_delivery_type TEXT
  CHECK (video_delivery_type IN ('upload', 'link'));

ALTER TABLE shop_products ADD COLUMN video_external_url TEXT;

CREATE TABLE IF NOT EXISTS shop_product_video_assets (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 524288000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shop_order_video_downloads (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_item_id TEXT NOT NULL UNIQUE,
  asset_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 10,
  last_downloaded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES shop_order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES shop_product_video_assets(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_shop_order_video_downloads_order
  ON shop_order_video_downloads (order_id, expires_at);
