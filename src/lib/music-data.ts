import { getCloudflareContext } from "@opennextjs/cloudflare";
import { releases as fallbackReleases, type Release } from "@/data/site";
import { imageAssetUrl } from "./file-assets";
import { getShopDatabase, type AdminDigitalAsset } from "./shop-data";

export type MusicReleaseRow = {
  id: string;
  title: string;
  description: string;
  release_type: "ALBUM" | "EP" | "SINGLE";
  artwork: Release["artwork"];
  artwork_id: string | null;
  selected_artwork_key: string | null;
  selected_artwork_alt: string | null;
  cover_art_key: string | null;
  audio_key: string | null;
  listen_url: string | null;
  support_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  tidal_url: string | null;
  youtube_url: string | null;
  soundcloud_url: string | null;
  bandcamp_url: string | null;
  sort_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
};

export type AdminMusicRelease = {
  id: string;
  title: string;
  description: string;
  releaseType: "ALBUM" | "EP" | "SINGLE";
  artwork: Release["artwork"];
  artworkId: string | null;
  coverArtKey: string | null;
  audioKey: string | null;
  coverArtUrl: string | null;
  audioUrl: string | null;
  listenUrl: string | null;
  supportUrl: string | null;
  purchaseProductId: string;
  purchasePriceGbp: number;
  purchasePriceEur: number;
  purchasePriceUsd: number;
  isForSale: boolean;
  digitalAssets: AdminDigitalAsset[];
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  tidalUrl: string | null;
  youtubeUrl: string | null;
  soundcloudUrl: string | null;
  bandcampUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export const musicPurchaseProductId = (releaseId: string) =>
  `music-release-${releaseId}`;

type MusicPurchaseRow = {
  id: string;
  price_gbp: number;
  price_eur: number;
  price_usd: number;
  sale_mode: "purchase" | "enquiry" | "unavailable";
  is_active: number;
};

export type MusicPurchase = {
  productId: string;
  purchasePriceGbp: number;
  purchasePriceEur: number;
  purchasePriceUsd: number;
  purchasePrices: Record<"GBP" | "EUR" | "USD", number>;
  isForSale: boolean;
  digitalAssets: AdminDigitalAsset[];
};

export async function getMusicPurchases(releaseIds: string[]) {
  const purchases = new Map<string, MusicPurchase>();
  if (!releaseIds.length) return purchases;
  const db = await getShopDatabase();
  if (!db) return purchases;

  const productIds = releaseIds.map(musicPurchaseProductId);
  const placeholders = productIds.map(() => "?").join(", ");
  try {
    const [products, assets] = await Promise.all([
      db.prepare(
        `SELECT id, price_gbp, price_eur, price_usd, sale_mode, is_active
         FROM shop_products WHERE id IN (${placeholders})`,
      ).bind(...productIds).all<MusicPurchaseRow>(),
      db.prepare(
        `SELECT id, product_id, format, r2_key, original_filename, content_type,
                size_bytes, created_at, updated_at
         FROM shop_product_digital_assets WHERE product_id IN (${placeholders})
         ORDER BY product_id, format`,
      ).bind(...productIds).all<import("./shop-data").DigitalAssetRow>(),
    ]);
    const assetsByProduct = new Map<string, AdminDigitalAsset[]>();
    for (const row of assets.results ?? []) {
      const current = assetsByProduct.get(row.product_id) ?? [];
      current.push({
        id: row.id,
        productId: row.product_id,
        format: row.format,
        originalFilename: row.original_filename,
        contentType: row.content_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
      assetsByProduct.set(row.product_id, current);
    }
    for (const row of products.results ?? []) {
      const releaseId = row.id.replace(/^music-release-/, "");
      const digitalAssets = assetsByProduct.get(row.id) ?? [];
      const hasBothFormats = ["mp3", "wav"].every((format) =>
        digitalAssets.some((asset) => asset.format === format),
      );
      purchases.set(releaseId, {
        productId: row.id,
        purchasePriceGbp: row.price_gbp,
        purchasePriceEur: row.price_eur,
        purchasePriceUsd: row.price_usd,
        purchasePrices: { GBP: row.price_gbp, EUR: row.price_eur, USD: row.price_usd },
        isForSale: row.is_active === 1 && row.sale_mode === "purchase" && hasBothFormats,
        digitalAssets,
      });
    }
  } catch {
    // Music remains available when commerce storage has not been migrated yet.
  }
  return purchases;
}

export type MusicArtworkRow = {
  id: string;
  title: string;
  image_key: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdminMusicArtwork = {
  id: string;
  title: string;
  imageKey: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function getMusicDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.MUSIC_DB ?? null;
  } catch {
    return null;
  }
}

export async function getMusicBucket() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.MUSIC_BUCKET ?? null;
  } catch {
    return null;
  }
}

function assetUrl(key: string | null) {
  return imageAssetUrl("/api/music/assets", key);
}

function rowToRelease(row: MusicReleaseRow): Release {
  const audioUrl = assetUrl(row.audio_key);
  const coverArtUrl = assetUrl(row.selected_artwork_key || row.cover_art_key);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    releaseType: row.release_type,
    isAvailable: row.is_published === 1,
    artwork: row.artwork,
    coverArtUrl,
    coverArtAlt: row.selected_artwork_alt,
    audioUrl,
    listenUrl: row.listen_url ?? audioUrl,
    supportUrl: row.support_url,
    streamingLinks: {
      spotify: row.spotify_url,
      appleMusic: row.apple_music_url,
      tidal: row.tidal_url,
      youtube: row.youtube_url,
      soundcloud: row.soundcloud_url,
      bandcamp: row.bandcamp_url,
    },
  };
}

export function rowToAdminMusicRelease(row: MusicReleaseRow): AdminMusicRelease {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    releaseType: row.release_type,
    artwork: row.artwork,
    artworkId: row.artwork_id,
    coverArtKey: row.cover_art_key,
    audioKey: row.audio_key,
    coverArtUrl: assetUrl(row.selected_artwork_key || row.cover_art_key),
    audioUrl: assetUrl(row.audio_key),
    listenUrl: row.listen_url,
    supportUrl: row.support_url,
    purchaseProductId: musicPurchaseProductId(row.id),
    purchasePriceGbp: 1.99,
    purchasePriceEur: 1.99,
    purchasePriceUsd: 1.99,
    isForSale: false,
    digitalAssets: [],
    spotifyUrl: row.spotify_url,
    appleMusicUrl: row.apple_music_url,
    tidalUrl: row.tidal_url,
    youtubeUrl: row.youtube_url,
    soundcloudUrl: row.soundcloud_url,
    bandcampUrl: row.bandcamp_url,
    sortOrder: row.sort_order,
    isVisible: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToAdminMusicArtwork(row: MusicArtworkRow): AdminMusicArtwork {
  return {
    id: row.id,
    title: row.title,
    imageKey: row.image_key,
    imageUrl: assetUrl(row.image_key) ?? "",
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMusicReleases() {
  const db = await getMusicDatabase();
  if (!db) return fallbackReleases;

  try {
    const result = await db
      .prepare(
        `SELECT music_releases.id,
                music_releases.title,
                music_releases.description,
                music_releases.release_type,
                music_releases.artwork,
                music_releases.artwork_id,
                music_artworks.image_key AS selected_artwork_key,
                music_artworks.alt_text AS selected_artwork_alt,
                music_releases.cover_art_key,
                music_releases.audio_key,
                music_releases.listen_url,
                music_releases.support_url,
                music_releases.spotify_url,
                music_releases.apple_music_url,
                music_releases.tidal_url,
                music_releases.youtube_url,
                music_releases.soundcloud_url,
                music_releases.bandcamp_url,
                music_releases.sort_order,
                music_releases.is_published,
                music_releases.created_at,
                music_releases.updated_at
         FROM music_releases
         LEFT JOIN music_artworks ON music_artworks.id = music_releases.artwork_id
         ORDER BY music_releases.sort_order ASC, music_releases.title ASC`,
      )
      .all<MusicReleaseRow>();

    const rows = result.results ?? [];
    const purchases = await getMusicPurchases(rows.map((row) => row.id));
    const dbReleases = rows.map((row) => {
      const release = rowToRelease(row);
      const purchase = purchases.get(row.id);
      if (purchase) {
        release.purchaseProductId = purchase.productId;
        release.purchasePriceGbp = purchase.purchasePriceGbp;
        release.purchasePrices = purchase.purchasePrices;
        release.isForSale = purchase.isForSale;
        release.digitalFormats = purchase.digitalAssets.map((asset) => asset.format);
      }
      return release;
    });
    return dbReleases.length > 0 ? dbReleases : fallbackReleases;
  } catch {
    return fallbackReleases;
  }
}
