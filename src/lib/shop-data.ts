import { getCloudflareContext } from "@opennextjs/cloudflare";
import { products as fallbackProducts, type Product } from "@/data/site";
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
  artwork: Product["artwork"];
  artworkId: string | null;
  frontArtworkUrl: string | null;
  backArtworkUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
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
    artwork: row.artwork,
    artworkId: row.artwork_id,
    frontArtworkUrl: assetUrl(row.front_key),
    backArtworkUrl: assetUrl(row.back_key),
    sortOrder: row.sort_order,
    isVisible: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function rowToProduct(row: ShopProductRow): Product {
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
    artwork: row.artwork,
    frontArtworkUrl: assetUrl(row.front_key),
    backArtworkUrl: assetUrl(row.back_key),
    artworkAlt: row.alt_text,
  };
}

export async function getShopProducts() {
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
         ORDER BY shop_products.sort_order ASC, shop_products.name ASC`,
      )
      .all<ShopProductRow>();

    const dbProducts = (result.results ?? []).map(rowToProduct);
    return dbProducts.length > 0 ? dbProducts : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function getShopProductById(productId: string) {
  const products = await getShopProducts();
  return products.find((product) => product.id === productId) ?? null;
}
