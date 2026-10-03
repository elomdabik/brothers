export const SCHEMA_VERSION = 1;

export const DB_NAME = 'akhwah_cache';

export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    purchase_price TEXT,
    wholesale_price TEXT,
    benefits TEXT,
    sizes TEXT,
    image_url TEXT,
    additional_images TEXT,
    internal_code TEXT,
    international_code TEXT,
    specifications TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`,
  `CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);`,
  `CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    old_price TEXT NOT NULL,
    new_price TEXT NOT NULL,
    discount_percent INTEGER NOT NULL,
    emoji TEXT,
    active INTEGER,
    expires_at TEXT,
    created_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_offers_active_expires ON offers(active, expires_at);`,
  `CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );`,
];
