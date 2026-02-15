export interface Env {
  DB: D1Database;
  RATE_LIMIT?: KVNamespace;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
  IMAGES_ACCOUNT_ID: string;
  IMAGES_ACCOUNT_HASH: string;
  IMAGES_VARIANT_AVATAR: string;
  IMAGES_VARIANT_COVER: string;
  IMAGES_API_TOKEN: string;
  SEED_SECRET?: string;
}
