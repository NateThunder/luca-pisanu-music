ALTER TABLE shop_products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'physical'
  CHECK (product_type IN ('physical', 'digital'));

ALTER TABLE shop_order_items ADD COLUMN product_type TEXT NOT NULL DEFAULT 'physical'
  CHECK (product_type IN ('physical', 'digital'));

CREATE TABLE IF NOT EXISTS shop_product_digital_assets (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('mp3', 'wav')),
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, format),
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shop_digital_assets_product
  ON shop_product_digital_assets (product_id, format);

CREATE TABLE IF NOT EXISTS shop_order_downloads (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_item_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 10,
  last_downloaded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_item_id, asset_id),
  FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES shop_order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES shop_product_digital_assets(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_shop_order_downloads_order
  ON shop_order_downloads (order_id, expires_at);
