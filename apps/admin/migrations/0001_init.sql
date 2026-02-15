-- Users: admin auth (email + password)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Shops: one per Pages deployment
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  name_lo TEXT NOT NULL,
  name_en TEXT NOT NULL,
  bio_lo TEXT NOT NULL,
  bio_en TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  whatsapp_message_lo TEXT NOT NULL,
  whatsapp_message_en TEXT NOT NULL,
  profile_image_id TEXT NULL,
  cover_image_id TEXT NULL,
  social_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shops_updated_at ON shops(updated_at);
