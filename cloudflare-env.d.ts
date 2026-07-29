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
  ADMIN_EMAIL?: string;
  ADMIN_SESSION_SECRET?: string;
  CHECKOUT_RATE_LIMIT_SECRET?: string;
  DOWNLOAD_TOKEN_SECRET?: string;
  APP_ORIGIN?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
  PAYPAL_ENVIRONMENT?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
}
