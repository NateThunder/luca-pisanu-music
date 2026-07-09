/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  SHOP_DB: D1Database;
  MUSIC_DB: D1Database;
  ABOUT_DB: D1Database;
  MUSIC_BUCKET: R2Bucket;
  SHOP_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  ADMIN_TOKEN?: string;
  COMMENT_IP_HASH_SECRET?: string;
  MUSIC_ADMIN_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
}
