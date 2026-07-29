ALTER TABLE shop_products ADD COLUMN sale_mode TEXT NOT NULL DEFAULT 'purchase';
ALTER TABLE shop_products ADD COLUMN track_inventory INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shop_products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;

UPDATE shop_products SET sale_mode = 'enquiry' WHERE id = 'remote-session';
UPDATE shop_products SET sale_mode = 'unavailable' WHERE id = 'artist-shirt';

CREATE TABLE IF NOT EXISTS shop_product_variants (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  label TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  options_json TEXT NOT NULL DEFAULT '{}',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shop_variants_product_sort
  ON shop_product_variants (product_id, is_active, sort_order, label);

CREATE TABLE IF NOT EXISTS shop_product_shipping_rates (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  fee_gbp_minor INTEGER NOT NULL DEFAULT 0,
  fee_eur_minor INTEGER NOT NULL DEFAULT 0,
  fee_usd_minor INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (product_id, country_code),
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shop_shipping_product_country
  ON shop_product_shipping_rates (product_id, country_code);

CREATE TABLE IF NOT EXISTS shop_orders (
  id TEXT PRIMARY KEY NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
  currency TEXT NOT NULL,
  item_total_minor INTEGER NOT NULL,
  shipping_total_minor INTEGER NOT NULL,
  total_minor INTEGER NOT NULL,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  address_city TEXT NOT NULL,
  address_region TEXT,
  address_postal_code TEXT NOT NULL,
  address_country_code TEXT NOT NULL,
  paypal_order_id TEXT UNIQUE,
  paypal_capture_id TEXT UNIQUE,
  paypal_payer_id TEXT,
  tracking_carrier TEXT,
  tracking_number TEXT,
  confirmation_email_sent_at TEXT,
  merchant_email_sent_at TEXT,
  shipping_email_sent_at TEXT,
  paid_at TEXT,
  shipped_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_created
  ON shop_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status
  ON shop_orders (status, fulfillment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_email
  ON shop_orders (customer_email, created_at DESC);

CREATE TABLE IF NOT EXISTS shop_order_items (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  variant_label TEXT,
  sku TEXT,
  options_json TEXT NOT NULL DEFAULT '{}',
  quantity INTEGER NOT NULL,
  unit_amount_minor INTEGER NOT NULL,
  shipping_amount_minor INTEGER NOT NULL,
  line_total_minor INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order
  ON shop_order_items (order_id);

CREATE TABLE IF NOT EXISTS shop_paypal_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  session_version INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user
  ON admin_sessions (user_id, expires_at);

CREATE TABLE IF NOT EXISTS admin_password_resets (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_password_resets_user
  ON admin_password_resets (user_id, expires_at);

CREATE TABLE IF NOT EXISTS admin_rate_limits (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  blocked_until TEXT,
  PRIMARY KEY (scope, key_hash)
);

CREATE TABLE IF NOT EXISTS shop_rate_limits (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, key_hash)
);
