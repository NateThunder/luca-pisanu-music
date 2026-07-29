import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  products as fallbackProducts,
  type Product,
  type ProductVariant,
} from "@/data/site";
import { imageAssetUrl } from "./file-assets";

type ShopProductRow = {
  id: string;
  name: string;
  category: string;
  category_slug: string;
  note: string;
  description: string;
  price_gbp: number;
  price_eur: number;
  price_usd: number;
  status: string;
  sale_mode: "purchase" | "enquiry" | "unavailable";
  product_type: "physical" | "digital";
  video_delivery_type: "upload" | "link" | null;
  video_external_url: string | null;
  track_inventory: number;
  stock_quantity: number;
  artwork: Product["artwork"];
  artwork_id: string | null;
  front_key: string | null;
  back_key: string | null;
  alt_text: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type AdminShopProduct = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  note: string;
  description: string;
  priceGbp: number;
  priceEur: number;
  priceUsd: number;
  status: string;
  saleMode: "purchase" | "enquiry" | "unavailable";
  productType: "physical" | "digital";
  videoDeliveryType: "upload" | "link" | null;
  videoExternalUrl: string | null;
  videoAsset: AdminVideoAsset | null;
  trackInventory: boolean;
  stockQuantity: number;
  artwork: Product["artwork"];
  artworkId: string | null;
  frontArtworkUrl: string | null;
  backArtworkUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  variants: AdminShopVariant[];
  shippingRates: AdminShippingRate[];
  digitalAssets: AdminDigitalAsset[];
};

export type AdminVideoAsset = {
  id: string; productId: string; originalFilename: string;
  contentType: string; sizeBytes: number; createdAt: string; updatedAt: string;
};

export type DigitalAssetRow = {
  id: string; product_id: string; format: "mp3" | "wav"; r2_key: string;
  original_filename: string; content_type: string; size_bytes: number;
  created_at: string; updated_at: string;
};

export type AdminDigitalAsset = {
  id: string; productId: string; format: "mp3" | "wav";
  originalFilename: string; contentType: string; sizeBytes: number;
  createdAt: string; updatedAt: string;
};

export type ShopVariantRow = {
  id: string;
  product_id: string;
  label: string;
  sku: string;
  options_json: string;
  stock_quantity: number;
  is_active: number;
  sort_order: number;
};

export type AdminShopVariant = ProductVariant & {
  productId: string;
  sortOrder: number;
};

export type ShippingRateRow = {
  id: string;
  product_id: string;
  country_code: string;
  fee_gbp_minor: number;
  fee_eur_minor: number;
  fee_usd_minor: number;
};

export type AdminShippingRate = {
  id: string;
  productId: string;
  countryCode: string;
  feeGbp: number;
  feeEur: number;
  feeUsd: number;
};

export type ShopArtworkRow = {
  id: string;
  title: string;
  front_key: string;
  back_key: string | null;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdminShopArtwork = {
  id: string;
  title: string;
  frontKey: string;
  backKey: string | null;
  frontUrl: string;
  backUrl: string | null;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function getShopDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.SHOP_DB ?? null;
  } catch {
    return null;
  }
}

export async function getShopBucket() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.SHOP_BUCKET ?? null;
  } catch {
    return null;
  }
}

function assetUrl(key: string | null) {
  return imageAssetUrl("/api/shop/assets", key);
}

export function rowToAdminShopProduct(row: ShopProductRow): AdminShopProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categorySlug: row.category_slug,
    note: row.note,
    description: row.description,
    priceGbp: row.price_gbp,
    priceEur: row.price_eur,
    priceUsd: row.price_usd,
    status: row.status,
    saleMode: row.sale_mode,
    productType: row.product_type,
    videoDeliveryType: row.video_delivery_type,
    videoExternalUrl: row.video_external_url,
    videoAsset: null,
    trackInventory: row.track_inventory === 1,
    stockQuantity: row.stock_quantity,
    artwork: row.artwork,
    artworkId: row.artwork_id,
    frontArtworkUrl: assetUrl(row.front_key),
    backArtworkUrl: assetUrl(row.back_key),
    sortOrder: row.sort_order,
    isVisible: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    variants: [],
    shippingRates: [],
    digitalAssets: [],
  };
}

function parseOptions(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .filter((entry): entry is [string, string] =>
          entry[0].trim().length > 0 && typeof entry[1] === "string",
        )
        .map(([key, option]) => [key.trim(), option.trim()]),
    );
  } catch {
    return {};
  }
}

export function rowToAdminShopVariant(row: ShopVariantRow): AdminShopVariant {
  return {
    id: row.id,
    productId: row.product_id,
    label: row.label,
    sku: row.sku,
    options: parseOptions(row.options_json),
    stockQuantity: row.stock_quantity,
    isAvailable: row.is_active === 1,
    sortOrder: row.sort_order,
  };
}

export function rowToAdminShippingRate(row: ShippingRateRow): AdminShippingRate {
  return {
    id: row.id,
    productId: row.product_id,
    countryCode: row.country_code,
    feeGbp: row.fee_gbp_minor / 100,
    feeEur: row.fee_eur_minor / 100,
    feeUsd: row.fee_usd_minor / 100,
  };
}

export function rowToAdminShopArtwork(row: ShopArtworkRow): AdminShopArtwork {
  return {
    id: row.id,
    title: row.title,
    frontKey: row.front_key,
    backKey: row.back_key,
    frontUrl: assetUrl(row.front_key) ?? "",
    backUrl: assetUrl(row.back_key),
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProduct(
  row: ShopProductRow,
  variants: ProductVariant[] = [],
): Product {
  const publicVariants = variants.map((variant) => ({
    ...variant,
    isAvailable:
      variant.isAvailable &&
      (row.track_inventory !== 1 || variant.stockQuantity > 0),
  }));
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categorySlug: row.category_slug,
    note: row.note,
    description: row.description,
    prices: {
      GBP: row.price_gbp,
      EUR: row.price_eur,
      USD: row.price_usd,
    },
    status: row.status,
    saleMode: row.sale_mode,
    productType: row.product_type,
    videoAvailable: row.product_type === "digital" && row.category_slug !== "_music-release",
    trackInventory: row.track_inventory === 1,
    stockQuantity: row.stock_quantity,
    variants: publicVariants,
    digitalFormats: [],
    artwork: row.artwork,
    frontArtworkUrl: assetUrl(row.front_key),
    backArtworkUrl: assetUrl(row.back_key),
    artworkAlt: row.alt_text,
  };
}

export async function getShopVariants(db: D1Database, includeInactive = false) {
  const result = await db
    .prepare(
      `SELECT id,
              product_id,
              label,
              sku,
              options_json,
              stock_quantity,
              is_active,
              sort_order
       FROM shop_product_variants
       ${includeInactive ? "" : "WHERE is_active = 1"}
       ORDER BY product_id ASC, sort_order ASC, label ASC`,
    )
    .all<ShopVariantRow>();

  return (result.results ?? []).map(rowToAdminShopVariant);
}

export async function getShopShippingRates(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT id,
              product_id,
              country_code,
              fee_gbp_minor,
              fee_eur_minor,
              fee_usd_minor
       FROM shop_product_shipping_rates
       ORDER BY product_id ASC, country_code ASC`,
    )
    .all<ShippingRateRow>();

  return (result.results ?? []).map(rowToAdminShippingRate);
}

export async function getShopDigitalAssets(db: D1Database) {
  const result = await db.prepare(
    `SELECT id, product_id, format, r2_key, original_filename, content_type,
            size_bytes, created_at, updated_at
     FROM shop_product_digital_assets ORDER BY product_id ASC, format ASC`,
  ).all<DigitalAssetRow>();
  return (result.results ?? []).map((row): AdminDigitalAsset => ({
    id: row.id, productId: row.product_id, format: row.format,
    originalFilename: row.original_filename, contentType: row.content_type,
    sizeBytes: row.size_bytes, createdAt: row.created_at, updatedAt: row.updated_at,
  }));
}

export async function getShopVideoAssets(db: D1Database) {
  const result = await db.prepare(
    `SELECT id, product_id, original_filename, content_type, size_bytes, created_at, updated_at
     FROM shop_product_video_assets ORDER BY product_id ASC`,
  ).all<{ id: string; product_id: string; original_filename: string; content_type: string; size_bytes: number; created_at: string; updated_at: string }>();
  return (result.results ?? []).map((row): AdminVideoAsset => ({
    id: row.id, productId: row.product_id, originalFilename: row.original_filename,
    contentType: row.content_type, sizeBytes: row.size_bytes,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));
}

export async function getShopProducts(options: { includeMusicReleases?: boolean } = {}) {
  const db = await getShopDatabase();
  if (!db) return fallbackProducts;

  try {
    const result = await db
      .prepare(
        `SELECT shop_products.id,
                shop_products.name,
                shop_products.category,
                shop_products.category_slug,
                shop_products.note,
                shop_products.description,
                shop_products.price_gbp,
                shop_products.price_eur,
                shop_products.price_usd,
                shop_products.status,
                shop_products.sale_mode,
                shop_products.product_type,
                shop_products.video_delivery_type,
                shop_products.video_external_url,
                shop_products.track_inventory,
                shop_products.stock_quantity,
                shop_products.artwork,
                shop_products.artwork_id,
                shop_artworks.front_key,
                shop_artworks.back_key,
                shop_artworks.alt_text,
                shop_products.sort_order,
                shop_products.is_active,
                shop_products.created_at,
                shop_products.updated_at
         FROM shop_products
         LEFT JOIN shop_artworks ON shop_artworks.id = shop_products.artwork_id
         WHERE shop_products.is_active = 1
           ${options.includeMusicReleases ? "" : "AND shop_products.category_slug <> '_music-release'"}
         ORDER BY shop_products.sort_order ASC, shop_products.name ASC`,
      )
      .all<ShopProductRow>();

    const [variants, digitalAssets, videoAssets] = await Promise.all([
      getShopVariants(db),
      getShopDigitalAssets(db),
      getShopVideoAssets(db),
    ]);
    const variantsByProduct = new Map<string, AdminShopVariant[]>();
    for (const variant of variants) {
      const current = variantsByProduct.get(variant.productId) ?? [];
      current.push(variant);
      variantsByProduct.set(variant.productId, current);
    }
    const dbProducts = (result.results ?? []).map((row) => {
      const product = rowToProduct(row, variantsByProduct.get(row.id) ?? []);
      product.digitalFormats = digitalAssets
        .filter((asset) => asset.productId === row.id)
        .map((asset) => asset.format);
      if (row.category_slug !== "_music-release" && row.product_type === "digital") {
        product.videoAvailable = row.video_delivery_type === "link"
          ? Boolean(row.video_external_url)
          : videoAssets.some((asset) => asset.productId === row.id);
      }
      return product;
    });
    return dbProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function getShopProductById(productId: string) {
  const products = await getShopProducts();
  return products.find((product) => product.id === productId) ?? null;
}
