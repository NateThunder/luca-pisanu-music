import type { Product } from "@/data/site";
import { requireAdmin } from "@/lib/admin-auth";
import {
  booleanValue,
  idFromRequestUrl,
  jsonError,
  jsonOk,
  nullableText,
  numberValue,
  readJson,
  slugify,
  text,
  type FieldErrors,
} from "@/lib/admin-route-utils";
import {
  getShopDatabase,
  getShopDigitalAssets,
  getShopVideoAssets,
  getShopShippingRates,
  getShopVariants,
  rowToAdminShopProduct,
} from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type ShopProductBody = {
  id?: unknown;
  name?: unknown;
  category?: unknown;
  categorySlug?: unknown;
  note?: unknown;
  description?: unknown;
  priceGbp?: unknown;
  priceEur?: unknown;
  priceUsd?: unknown;
  status?: unknown;
  saleMode?: unknown;
  productType?: unknown;
  videoDeliveryType?: unknown;
  videoExternalUrl?: unknown;
  trackInventory?: unknown;
  stockQuantity?: unknown;
  artwork?: unknown;
  artworkId?: unknown;
  sortOrder?: unknown;
  isVisible?: unknown;
};

type PatchBody = {
  action?: "visibility" | "reorder";
  id?: unknown;
  ids?: unknown;
  isVisible?: unknown;
};

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

const artworkValues = new Set<Product["artwork"]>([
  "vinyl",
  "book",
  "shirt",
  "session",
]);

const columns = `id,
  name,
  category,
  category_slug,
  note,
  description,
  price_gbp,
  price_eur,
  price_usd,
  status,
  sale_mode,
  product_type,
  video_delivery_type,
  video_external_url,
  track_inventory,
  stock_quantity,
  artwork,
  artwork_id,
  NULL AS front_key,
  NULL AS back_key,
  NULL AS alt_text,
  sort_order,
  is_active,
  created_at,
  updated_at`;

async function fetchProduct(db: D1Database, id: string) {
  return await db
    .prepare(`SELECT ${columns} FROM shop_products WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<ShopProductRow>();
}

async function artworkExists(db: D1Database, id: string) {
  if (!id) return true;
  const row = await db
    .prepare(`SELECT id FROM shop_artworks WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string }>();
  return Boolean(row);
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);

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
       WHERE shop_products.category_slug <> '_music-release'
       ORDER BY shop_products.sort_order ASC, shop_products.name ASC`,
    )
    .all<ShopProductRow>();

  const [variants, shippingRates, digitalAssets, videoAssets] = await Promise.all([
    getShopVariants(db, true),
    getShopShippingRates(db),
    getShopDigitalAssets(db),
    getShopVideoAssets(db),
  ]);
  const products = (result.results ?? []).map(rowToAdminShopProduct);
  for (const product of products) {
    product.variants = variants.filter((variant) => variant.productId === product.id);
    product.shippingRates = shippingRates.filter((rate) => rate.productId === product.id);
    product.digitalAssets = digitalAssets.filter((asset) => asset.productId === product.id);
    product.videoAsset = videoAssets.find((asset) => asset.productId === product.id) ?? null;
  }

  return jsonOk({ products });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await readJson<ShopProductBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);

  const errors: FieldErrors = {};
  const name = text(body.name);
  const category = text(body.category);
  const categorySlug = slugify(text(body.categorySlug) || category);
  const note = text(body.note);
  const description = text(body.description);
  const status = text(body.status);
  const saleModeInput = text(body.saleMode);
  const saleMode = new Set(["purchase", "enquiry", "unavailable"]).has(
    saleModeInput,
  )
    ? (saleModeInput as "purchase" | "enquiry" | "unavailable")
    : "purchase";
  const trackInventory = booleanValue(body.trackInventory, false);
  const productType = text(body.productType) === "digital" ? "digital" : "physical";
  const videoDeliveryInput = text(body.videoDeliveryType);
  const videoDeliveryType = productType === "digital" && new Set(["upload", "link"]).has(videoDeliveryInput)
    ? (videoDeliveryInput as "upload" | "link") : null;
  const videoExternalUrl = videoDeliveryType === "link" ? nullableText(body.videoExternalUrl) : null;
  const stockQuantity = Math.max(0, Math.floor(numberValue(body.stockQuantity, 0)));
  const id = slugify(text(body.id) || name);
  const artworkId = nullableText(body.artworkId);
  const artworkInput = text(body.artwork) || "vinyl";
  const artwork = artworkValues.has(artworkInput as Product["artwork"])
    ? (artworkInput as Product["artwork"])
    : "vinyl";
  const priceGbp = numberValue(body.priceGbp, Number.NaN);
  const priceEur = numberValue(body.priceEur, Number.NaN);
  const priceUsd = numberValue(body.priceUsd, Number.NaN);
  const sortOrder = numberValue(body.sortOrder, 100);
  const isVisible = booleanValue(body.isVisible, true);

  if (!id) errors.id = "Enter an id or product name.";
  if (!name) errors.name = "Name is required.";
  if (!category) errors.category = "Category is required.";
  if (!categorySlug) errors.categorySlug = "Category slug is required.";
  if (!note) errors.note = "Note is required.";
  if (!description) errors.description = "Description is required.";
  if (!status) errors.status = "Status text is required.";
  if (artworkId && !(await artworkExists(db, artworkId))) {
    errors.artworkId = "Select an existing artwork.";
  }
  if (!Number.isFinite(priceGbp) || priceGbp < 0) errors.priceGbp = "Enter a GBP price.";
  if (!Number.isFinite(priceEur) || priceEur < 0) errors.priceEur = "Enter a EUR price.";
  if (!Number.isFinite(priceUsd) || priceUsd < 0) errors.priceUsd = "Enter a USD price.";
  if (videoDeliveryType === "link") {
    try { if (!videoExternalUrl || !new URL(videoExternalUrl).protocol.startsWith("http")) throw new Error(); }
    catch { errors.videoExternalUrl = "Enter a valid HTTPS video or download URL."; }
  }

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  await db
    .prepare(
      `INSERT INTO shop_products (
        id,
        name,
        category,
        category_slug,
        note,
        description,
        price_gbp,
        price_eur,
        price_usd,
        status,
        sale_mode,
        product_type,
        video_delivery_type,
        video_external_url,
        track_inventory,
        stock_quantity,
        artwork,
        artwork_id,
        sort_order,
        is_active,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        category_slug = excluded.category_slug,
        note = excluded.note,
        description = excluded.description,
        price_gbp = excluded.price_gbp,
        price_eur = excluded.price_eur,
        price_usd = excluded.price_usd,
        status = excluded.status,
        sale_mode = excluded.sale_mode,
        product_type = excluded.product_type,
        video_delivery_type = excluded.video_delivery_type,
        video_external_url = excluded.video_external_url,
        track_inventory = excluded.track_inventory,
        stock_quantity = excluded.stock_quantity,
        artwork = excluded.artwork,
        artwork_id = excluded.artwork_id,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      name,
      category,
      categorySlug,
      note,
      description,
      Math.round(priceGbp),
      Math.round(priceEur),
      Math.round(priceUsd),
      status,
      saleMode,
      productType,
      videoDeliveryType,
      videoExternalUrl,
      trackInventory ? 1 : 0,
      stockQuantity,
      artwork,
      artworkId,
      sortOrder,
      isVisible ? 1 : 0,
      new Date().toISOString(),
    )
    .run();

  const product = await fetchProduct(db, id);
  return jsonOk({ product: product ? rowToAdminShopProduct(product) : null });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);

  const body = await readJson<PatchBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  if (body.action === "reorder") {
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
    if (!ids.length) return jsonError("Product ids are required.", 422);

    await db.batch(
      ids.map((id, index) =>
        db
          .prepare(`UPDATE shop_products SET sort_order = ?, updated_at = ? WHERE id = ?`)
          .bind((index + 1) * 10, new Date().toISOString(), id),
      ),
    );

    return jsonOk({ ids });
  }

  if (body.action === "visibility") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return jsonError("Product id is required.", 422, { id: "Required." });

    const isVisible = booleanValue(body.isVisible, false);
    await db
      .prepare(`UPDATE shop_products SET is_active = ?, updated_at = ? WHERE id = ?`)
      .bind(isVisible ? 1 : 0, new Date().toISOString(), id)
      .run();

    return jsonOk({ id, isVisible });
  }

  return jsonError("Unsupported action.", 400);
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getShopDatabase();
  if (!db) return jsonError("Shop database is not configured.", 503);

  const body = await readJson<{ id?: unknown }>(request);
  const bodyId = typeof body?.id === "string" ? body.id.trim() : "";
  const id = bodyId || idFromRequestUrl(request);
  if (!id) return jsonError("Product id is required.", 422, { id: "Required." });

  await db.prepare(`DELETE FROM shop_products WHERE id = ?`).bind(id).run();

  return jsonOk({ id });
}
