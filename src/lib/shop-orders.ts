import { createHmac, randomBytes } from "node:crypto";
import type { CurrencyCode } from "@/data/site";
import { getAppOrigin, getRuntimeValue } from "./runtime-env";
import { getShopDatabase } from "./shop-data";
import { createPayPalOrder, type PayPalOrderResponse } from "./paypal";
import { escapeHtml, sendTransactionalEmail } from "./transactional-email";
import { ensureOrderDownloads } from "./shop-downloads";
import { ensureOrderVideoAccess } from "./shop-video-downloads";

export type CheckoutCartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  chosenAmountMinor: number | null;
};

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
};

type ProductRow = {
  id: string;
  name: string;
  category_slug: string;
  price_gbp: number;
  price_eur: number;
  price_usd: number;
  sale_mode: string;
  product_type: "physical" | "digital";
  video_delivery_type: "upload" | "link" | null;
  video_external_url: string | null;
  track_inventory: number;
  stock_quantity: number;
  is_active: number;
};

type VariantRow = {
  id: string;
  product_id: string;
  label: string;
  sku: string;
  options_json: string;
  stock_quantity: number;
  is_active: number;
};

type ShippingRow = {
  product_id: string;
  fee_gbp_minor: number;
  fee_eur_minor: number;
  fee_usd_minor: number;
};

export type ShopOrderRow = {
  id: string;
  order_number: string;
  status: string;
  fulfillment_status: string;
  currency: CurrencyCode;
  item_total_minor: number;
  shipping_total_minor: number;
  total_minor: number;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_message: string | null;
  address_line_1: string;
  address_line_2: string | null;
  address_city: string;
  address_region: string | null;
  address_postal_code: string;
  address_country_code: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  paypal_payer_id: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  confirmation_email_sent_at: string | null;
  merchant_email_sent_at: string | null;
  shipping_email_sent_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShopOrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  sku: string | null;
  options_json: string;
  quantity: number;
  unit_amount_minor: number;
  shipping_amount_minor: number;
  line_total_minor: number;
  product_type: "physical" | "digital";
};

export type ShopOrderWithItems = ShopOrderRow & { items: ShopOrderItemRow[] };

export class CheckoutValidationError extends Error {
  constructor(
    message: string,
    public readonly unavailableProductIds: string[] = [],
  ) {
    super(message);
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function currencyForCountry(countryCode?: string | null): CurrencyCode {
  const country = countryCode?.toUpperCase();
  if (country === "GB") return "GBP";
  const eu = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"]);
  return country && eu.has(country) ? "EUR" : "USD";
}

export function requestCountry(request: Request) {
  const value = request.headers.get("cf-ipcountry")?.trim().toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) ? value : null;
}

export async function hasValidCheckoutOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([
    new URL(request.url).origin,
    new URL(await getAppOrigin()).origin,
  ]);
  return allowed.has(origin);
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateCheckoutAddress(value: unknown): CheckoutAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CheckoutValidationError("Enter a delivery address.");
  }
  const input = value as Record<string, unknown>;
  const address: CheckoutAddress = {
    firstName: clean(input.firstName, 80),
    lastName: clean(input.lastName, 80),
    email: clean(input.email, 254).toLowerCase(),
    phone: clean(input.phone, 40),
    line1: clean(input.line1, 180),
    line2: clean(input.line2, 180),
    city: clean(input.city, 100),
    region: clean(input.region, 100),
    postalCode: clean(input.postalCode, 32),
    countryCode: clean(input.countryCode, 2).toUpperCase(),
  };
  if (
    !address.firstName ||
    !address.lastName ||
    !emailPattern.test(address.email) ||
    !address.phone ||
    !address.line1 ||
    !address.city ||
    !address.postalCode ||
    !/^[A-Z]{2}$/.test(address.countryCode)
  ) {
    throw new CheckoutValidationError("Check the required delivery details.");
  }
  return address;
}

function validateCustomer(value: unknown): CheckoutAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CheckoutValidationError("Enter your contact details.");
  }
  const input = value as Record<string, unknown>;
  const address: CheckoutAddress = {
    firstName: clean(input.firstName, 80), lastName: clean(input.lastName, 80),
    email: clean(input.email, 254).toLowerCase(), phone: clean(input.phone, 40),
    line1: clean(input.line1, 180), line2: clean(input.line2, 180),
    city: clean(input.city, 100), region: clean(input.region, 100),
    postalCode: clean(input.postalCode, 32),
    countryCode: clean(input.countryCode, 2).toUpperCase(),
  };
  if (!address.firstName || !address.lastName || !emailPattern.test(address.email)) {
    throw new CheckoutValidationError("Check your name and email address.");
  }
  return address;
}

export function normalizeCheckoutCart(value: unknown): CheckoutCartItem[] {
  if (!Array.isArray(value) || !value.length || value.length > 50) {
    throw new CheckoutValidationError("Your cart is empty or too large.");
  }
  const normalized: CheckoutCartItem[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") {
      throw new CheckoutValidationError("The cart contains an invalid item.");
    }
    const item = candidate as Record<string, unknown>;
    const productId = clean(item.productId, 100);
    const variantId = item.variantId === null ? null : clean(item.variantId, 100) || null;
    const quantity = typeof item.quantity === "number" ? Math.floor(item.quantity) : 0;
    const chosenAmountMinor = typeof item.chosenAmountMinor === "number"
      ? Math.round(item.chosenAmountMinor)
      : null;
    if (!productId || quantity < 1 || quantity > 99) {
      throw new CheckoutValidationError("The cart contains an invalid item.");
    }
    if (chosenAmountMinor !== null && (chosenAmountMinor < 0 || chosenAmountMinor > 10_000)) {
      throw new CheckoutValidationError("A supporter amount is outside the allowed range.");
    }
    normalized.push({ productId, variantId, quantity, chosenAmountMinor });
  }
  return normalized;
}

function placeholders(count: number) {
  return Array.from({ length: count }, () => "?").join(", ");
}

function productPriceMinor(product: ProductRow, currency: CurrencyCode) {
  const amount =
    currency === "GBP"
      ? product.price_gbp
      : currency === "USD"
        ? product.price_usd
        : product.price_eur;
  return Math.round(amount * 100);
}

function shippingPriceMinor(rate: ShippingRow, currency: CurrencyCode) {
  return currency === "GBP"
    ? rate.fee_gbp_minor
    : currency === "USD"
      ? rate.fee_usd_minor
      : rate.fee_eur_minor;
}

function moneyValue(minor: number) {
  return (minor / 100).toFixed(2);
}

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `LP-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function consumeCheckoutRateLimit(request: Request) {
  const db = await getShopDatabase();
  if (!db) return false;
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const secret =
    (await getRuntimeValue("CHECKOUT_RATE_LIMIT_SECRET")) ||
    (await getRuntimeValue("ADMIN_SESSION_SECRET")) ||
    "local-checkout-rate-limit";
  const keyHash = createHmac("sha256", secret).update(ip).digest("hex");
  const now = new Date();
  const existing = await db
    .prepare(
      `SELECT window_started_at, request_count FROM shop_rate_limits
       WHERE scope = 'create-order' AND key_hash = ? LIMIT 1`,
    )
    .bind(keyHash)
    .first<{ window_started_at: string; request_count: number }>();
  const expired =
    !existing || now.getTime() - new Date(existing.window_started_at).getTime() >= 10 * 60 * 1000;
  const count = expired ? 1 : existing.request_count + 1;
  await db
    .prepare(
      `INSERT INTO shop_rate_limits (scope, key_hash, window_started_at, request_count)
       VALUES ('create-order', ?, ?, ?)
       ON CONFLICT(scope, key_hash) DO UPDATE SET
         window_started_at = excluded.window_started_at,
         request_count = excluded.request_count`,
    )
    .bind(keyHash, expired ? now.toISOString() : existing.window_started_at, count)
    .run();
  return count <= 10;
}

async function calculateCheckout(
  request: Request,
  cartValue: unknown,
  addressValue: unknown,
) {
  const db = await getShopDatabase();
  if (!db) throw new Error("Shop database is not configured.");
  const cart = normalizeCheckoutCart(cartValue);
  let address = validateCustomer(addressValue);
  const currency = currencyForCountry(requestCountry(request));
  const productIds = [...new Set(cart.map((item) => item.productId))];

  const [productsResult, variantsResult, assetsResult, videoAssetsResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, name, category_slug, price_gbp, price_eur, price_usd, sale_mode, product_type,
                video_delivery_type, video_external_url,
                track_inventory, stock_quantity, is_active
         FROM shop_products WHERE id IN (${placeholders(productIds.length)})`,
      )
      .bind(...productIds)
      .all<ProductRow>(),
    db
      .prepare(
        `SELECT id, product_id, label, sku, options_json, stock_quantity, is_active
         FROM shop_product_variants WHERE product_id IN (${placeholders(productIds.length)})`,
      )
      .bind(...productIds)
      .all<VariantRow>(),
    db.prepare(
      `SELECT product_id, format FROM shop_product_digital_assets
       WHERE product_id IN (${placeholders(productIds.length)})`,
    ).bind(...productIds).all<{ product_id: string; format: string }>(),
    db.prepare(
      `SELECT product_id FROM shop_product_video_assets WHERE product_id IN (${placeholders(productIds.length)})`,
    ).bind(...productIds).all<{ product_id: string }>(),
  ]);

  const products = new Map((productsResult.results ?? []).map((row) => [row.id, row]));
  const variants = variantsResult.results ?? [];
  const requiresShipping = [...products.values()].some((row) => row.product_type === "physical");
  if (requiresShipping) address = validateCheckoutAddress(addressValue);
  const physicalIds = productIds.filter((id) => products.get(id)?.product_type === "physical");
  const ratesResult = physicalIds.length
    ? await db.prepare(
        `SELECT product_id, fee_gbp_minor, fee_eur_minor, fee_usd_minor
         FROM shop_product_shipping_rates
         WHERE country_code = ? AND product_id IN (${placeholders(physicalIds.length)})`,
      ).bind(address.countryCode, ...physicalIds).all<ShippingRow>()
    : { results: [] as ShippingRow[] };
  const rates = new Map((ratesResult.results ?? []).map((row) => [row.product_id, row]));
  const formats = new Map<string, Set<string>>();
  for (const asset of assetsResult.results ?? []) {
    const current = formats.get(asset.product_id) ?? new Set<string>();
    current.add(asset.format); formats.set(asset.product_id, current);
  }
  const unavailable = new Set<string>();
  for (const productId of productIds) {
    const product = products.get(productId);
    if (!product || product.is_active !== 1 || product.sale_mode !== "purchase") {
      unavailable.add(productId);
    }
    if (product?.product_type === "physical" && !rates.has(productId)) unavailable.add(productId);
    if (product?.product_type === "digital" && product.category_slug === "_music-release" &&
        (!formats.get(productId)?.has("mp3") || !formats.get(productId)?.has("wav"))) {
      unavailable.add(productId);
    }
    if (product?.product_type === "digital" && product.category_slug !== "_music-release") {
      const hasUpload = product.video_delivery_type === "upload" &&
        (videoAssetsResult.results ?? []).some((asset) => asset.product_id === productId);
      const hasLink = product.video_delivery_type === "link" && Boolean(product.video_external_url);
      if (!hasUpload && !hasLink) unavailable.add(productId);
    }
  }
  if (unavailable.size) {
    throw new CheckoutValidationError(
      "One or more items cannot be delivered to this country.",
      [...unavailable],
    );
  }

  const orderItems: ShopOrderItemRow[] = [];
  let itemTotal = 0;
  for (const item of cart) {
    const product = products.get(item.productId)!;
    const productVariants = variants.filter((variant) => variant.product_id === product.id && variant.is_active === 1);
    let variant: VariantRow | null = null;
    if (productVariants.length) {
      variant = productVariants.find((candidate) => candidate.id === item.variantId) ?? null;
      if (!variant) {
        throw new CheckoutValidationError(`Choose an available option for ${product.name}.`, [product.id]);
      }
    } else if (item.variantId) {
      throw new CheckoutValidationError(`The selected option for ${product.name} is unavailable.`, [product.id]);
    }

    const availableStock = variant?.stock_quantity ?? product.stock_quantity;
    if (product.track_inventory === 1 && availableStock < item.quantity) {
      throw new CheckoutValidationError(`${product.name} does not have enough stock.`, [product.id]);
    }

    const minimumAmount = productPriceMinor(product, currency);
    const isMusicDownload = product.product_type === "digital" && product.category_slug === "_music-release";
    const unitAmount = isMusicDownload && item.chosenAmountMinor !== null
      ? item.chosenAmountMinor
      : minimumAmount;
    if (isMusicDownload && (unitAmount < minimumAmount || unitAmount > 10_000)) {
      throw new CheckoutValidationError(`Choose an amount between ${moneyValue(minimumAmount)} and 100.00 for ${product.name}.`, [product.id]);
    }
    const lineTotal = unitAmount * item.quantity;
    itemTotal += lineTotal;
    orderItems.push({
      id: crypto.randomUUID(),
      order_id: "",
      product_id: product.id,
      variant_id: variant?.id ?? null,
      product_name: product.name,
      variant_label: variant?.label ?? null,
      sku: variant?.sku || null,
      options_json: variant?.options_json ?? "{}",
      quantity: item.quantity,
      unit_amount_minor: unitAmount,
      shipping_amount_minor: 0,
      line_total_minor: lineTotal,
      product_type: product.product_type,
    });
  }

  let shippingTotal = 0;
  for (const productId of physicalIds) {
    const shipping = shippingPriceMinor(rates.get(productId)!, currency);
    shippingTotal += shipping;
    const firstItem = orderItems.find((item) => item.product_id === productId);
    if (firstItem) firstItem.shipping_amount_minor = shipping;
  }
  const total = itemTotal + shippingTotal;

  return {
    address,
    currency,
    db,
    itemTotal,
    orderItems,
    shippingTotal,
    total,
    requiresShipping,
  };
}

export async function quoteCheckoutOrder(
  request: Request,
  cartValue: unknown,
  addressValue: unknown,
) {
  const calculation = await calculateCheckout(request, cartValue, addressValue);
  return {
    currency: calculation.currency,
    itemTotalMinor: calculation.itemTotal,
    shippingTotalMinor: calculation.shippingTotal,
    totalMinor: calculation.total,
    requiresShipping: calculation.requiresShipping,
  };
}

export async function createCheckoutOrder(
  request: Request,
  cartValue: unknown,
  addressValue: unknown,
  messageValue?: unknown,
) {
  const {
    address,
    currency,
    db,
    itemTotal,
    orderItems,
    shippingTotal,
    total,
    requiresShipping,
  } = await calculateCheckout(request, cartValue, addressValue);
  const id = crypto.randomUUID();
  const reference = orderNumber();
  const customerMessage = clean(messageValue, 2000) || null;
  for (const item of orderItems) item.order_id = id;

  const origin = await getAppOrigin();
  const paypalPayload = {
    intent: "CAPTURE",
    application_context: {
      brand_name: "Luca Pisanu Music Shop",
      shipping_preference: requiresShipping ? "SET_PROVIDED_ADDRESS" : "NO_SHIPPING",
      user_action: "PAY_NOW",
      return_url: `${origin}/shop/checkout`,
      cancel_url: `${origin}/shop/checkout`,
    },
    purchase_units: [
      {
        reference_id: id,
        custom_id: id,
        invoice_id: reference,
        description: `Luca Pisanu shop order ${reference}`,
        items: orderItems.map((item) => ({
          name: item.variant_label
            ? `${item.product_name} — ${item.variant_label}`.slice(0, 127)
            : item.product_name.slice(0, 127),
          quantity: String(item.quantity),
          category: item.product_type === "digital" ? "DIGITAL_GOODS" : "PHYSICAL_GOODS",
          sku: (item.sku || item.product_id).slice(0, 127),
          unit_amount: { currency_code: currency, value: moneyValue(item.unit_amount_minor) },
        })),
        amount: {
          currency_code: currency,
          value: moneyValue(total),
          breakdown: {
            item_total: { currency_code: currency, value: moneyValue(itemTotal) },
            ...(requiresShipping
              ? { shipping: { currency_code: currency, value: moneyValue(shippingTotal) } }
              : {}),
          },
        },
        ...(requiresShipping ? { shipping: {
          name: { full_name: `${address.firstName} ${address.lastName}`.slice(0, 300) },
          address: {
            address_line_1: address.line1,
            ...(address.line2 ? { address_line_2: address.line2 } : {}),
            admin_area_2: address.city,
            ...(address.region ? { admin_area_1: address.region } : {}),
            postal_code: address.postalCode,
            country_code: address.countryCode,
          },
        } } : {}),
      },
    ],
  };
  const paypalOrder = await createPayPalOrder(paypalPayload, id);
  if (!paypalOrder.id) throw new Error("PayPal did not create an order.");

  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO shop_orders (
           id, order_number, status, fulfillment_status, currency,
           item_total_minor, shipping_total_minor, total_minor,
           customer_first_name, customer_last_name, customer_email, customer_phone, customer_message,
           address_line_1, address_line_2, address_city, address_region,
           address_postal_code, address_country_code, paypal_order_id, updated_at
         ) VALUES (?, ?, 'pending_payment', 'unfulfilled', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        reference,
        currency,
        itemTotal,
        shippingTotal,
        total,
        address.firstName,
        address.lastName,
        address.email,
        address.phone,
        customerMessage,
        address.line1,
        address.line2 || null,
        address.city,
        address.region || null,
        address.postalCode,
        address.countryCode,
        paypalOrder.id,
        now,
      ),
    ...orderItems.map((item) =>
      db
        .prepare(
          `INSERT INTO shop_order_items (
             id, order_id, product_id, variant_id, product_name, variant_label,
             sku, options_json, quantity, unit_amount_minor, shipping_amount_minor,
             line_total_minor, product_type
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          item.id,
          item.order_id,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.variant_label,
          item.sku,
          item.options_json,
          item.quantity,
          item.unit_amount_minor,
          item.shipping_amount_minor,
          item.line_total_minor,
          item.product_type,
        ),
    ),
  ]);

  return { orderId: paypalOrder.id, orderNumber: reference, currency, totalMinor: total };
}

export async function getOrderByPayPalId(db: D1Database, paypalOrderId: string) {
  const order = await db
    .prepare(`SELECT * FROM shop_orders WHERE paypal_order_id = ? LIMIT 1`)
    .bind(paypalOrderId)
    .first<ShopOrderRow>();
  if (!order) return null;
  const items = await db
    .prepare(`SELECT * FROM shop_order_items WHERE order_id = ? ORDER BY created_at ASC`)
    .bind(order.id)
    .all<ShopOrderItemRow>();
  return { ...order, items: items.results ?? [] };
}

export async function createFreeCheckoutOrder(
  request: Request,
  cartValue: unknown,
  addressValue: unknown,
  messageValue?: unknown,
) {
  const calculation = await calculateCheckout(request, cartValue, addressValue);
  if (calculation.total !== 0 || calculation.requiresShipping) {
    throw new CheckoutValidationError("This order must be completed through the payment options.");
  }
  const id = crypto.randomUUID();
  const reference = orderNumber();
  const now = new Date().toISOString();
  const customerMessage = clean(messageValue, 2000) || null;
  for (const item of calculation.orderItems) item.order_id = id;
  await calculation.db.batch([
    calculation.db.prepare(
      `INSERT INTO shop_orders (
        id, order_number, status, fulfillment_status, currency,
        item_total_minor, shipping_total_minor, total_minor,
        customer_first_name, customer_last_name, customer_email, customer_phone, customer_message,
        address_line_1, address_line_2, address_city, address_region,
        address_postal_code, address_country_code, paid_at, updated_at
      ) VALUES (?, ?, 'paid', 'unfulfilled', ?, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, reference, calculation.currency, calculation.address.firstName,
      calculation.address.lastName, calculation.address.email, calculation.address.phone,
      customerMessage, calculation.address.line1, calculation.address.line2 || null,
      calculation.address.city, calculation.address.region || null,
      calculation.address.postalCode, calculation.address.countryCode, now, now),
    ...calculation.orderItems.map((item) => calculation.db.prepare(
      `INSERT INTO shop_order_items (id, order_id, product_id, variant_id, product_name,
       variant_label, sku, options_json, quantity, unit_amount_minor, shipping_amount_minor,
       line_total_minor, product_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(item.id, id, item.product_id, item.variant_id, item.product_name, item.variant_label,
      item.sku, item.options_json, item.quantity, 0, 0, 0, item.product_type)),
  ]);
  const order = await calculation.db.prepare(`SELECT * FROM shop_orders WHERE id = ?`).bind(id).first<ShopOrderRow>();
  if (!order) throw new Error("The free order could not be created.");
  const complete = { ...order, items: calculation.orderItems };
  await sendOrderEmails(calculation.db, complete);
  const downloads = await ensureOrderDownloads(calculation.db, id);
  return { orderNumber: reference, customerEmail: calculation.address.email, downloads };
}

export async function getOrderByCaptureId(db: D1Database, captureId: string) {
  const order = await db
    .prepare(`SELECT * FROM shop_orders WHERE paypal_capture_id = ? LIMIT 1`)
    .bind(captureId)
    .first<ShopOrderRow>();
  if (!order) return null;
  const items = await db
    .prepare(`SELECT * FROM shop_order_items WHERE order_id = ? ORDER BY created_at ASC`)
    .bind(order.id)
    .all<ShopOrderItemRow>();
  return { ...order, items: items.results ?? [] };
}

function captureFrom(response: PayPalOrderResponse) {
  return response.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
}

export function validateCompletedCapture(order: ShopOrderWithItems, response: PayPalOrderResponse) {
  const capture = captureFrom(response);
  if (
    response.id !== order.paypal_order_id ||
    response.status !== "COMPLETED" ||
    !capture ||
    capture.status !== "COMPLETED" ||
    capture.amount.currency_code !== order.currency ||
    capture.amount.value !== moneyValue(order.total_minor)
  ) {
    throw new Error("PayPal returned an unexpected capture result.");
  }
  return capture;
}

export async function finalizePaidOrder(
  db: D1Database,
  order: ShopOrderWithItems,
  captureId: string,
  payerId?: string | null,
) {
  if (order.status !== "pending_payment") return order;
  const now = new Date().toISOString();
  const stockStatements = order.items.map((item) =>
    item.variant_id
      ? db
          .prepare(
            `UPDATE shop_product_variants
             SET stock_quantity = max(0, stock_quantity - ?), updated_at = ?
             WHERE id = ?
               AND EXISTS (
                 SELECT 1 FROM shop_products
                 WHERE shop_products.id = shop_product_variants.product_id
                   AND shop_products.track_inventory = 1
               )
               AND EXISTS (
                 SELECT 1 FROM shop_orders
                 WHERE id = ? AND status = 'pending_payment'
               )`,
          )
          .bind(item.quantity, now, item.variant_id, order.id)
      : db
          .prepare(
            `UPDATE shop_products
             SET stock_quantity = max(0, stock_quantity - ?), updated_at = ?
             WHERE id = ? AND track_inventory = 1
               AND EXISTS (
                 SELECT 1 FROM shop_orders
                 WHERE id = ? AND status = 'pending_payment'
               )`,
          )
          .bind(item.quantity, now, item.product_id, order.id),
  );
  await db.batch([
    ...stockStatements,
    db
      .prepare(
        `UPDATE shop_orders
         SET status = 'paid', paypal_capture_id = ?, paypal_payer_id = ?, paid_at = ?, updated_at = ?
         WHERE id = ? AND status = 'pending_payment'`,
      )
      .bind(captureId, payerId || null, now, now, order.id),
  ]);

  const updated = await getOrderByPayPalId(db, order.paypal_order_id!);
  if (updated?.status === "paid") await sendOrderEmails(db, updated);
  return updated ?? order;
}

export function formatOrderMoney(minor: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(minor / 100);
}

function orderEmailBody(order: ShopOrderWithItems) {
  const lines = order.items.map(
    (item) =>
      `${item.quantity} × ${item.product_name}${item.variant_label ? ` (${item.variant_label})` : ""} — ${formatOrderMoney(item.line_total_minor, order.currency)}`,
  );
  const address = [
    `${order.customer_first_name} ${order.customer_last_name}`,
    order.address_line_1,
    order.address_line_2,
    order.address_city,
    order.address_region,
    order.address_postal_code,
    order.address_country_code,
  ].filter((value): value is string => Boolean(value));
  return { lines, address };
}

export async function sendOrderEmails(db: D1Database, order: ShopOrderWithItems) {
  const { lines, address } = orderEmailBody(order);
  const downloads = order.items.some((item) => item.product_type === "digital")
    ? await ensureOrderDownloads(db, order.id)
    : [];
  const videos = order.items.some((item) => item.product_type === "digital")
    ? await ensureOrderVideoAccess(db, order.id)
    : [];
  const downloadText = downloads.length
    ? `\n\nYour MP3 and WAV downloads (valid for 7 days, up to 10 downloads each):\n${downloads.map((download) => `${download.format.toUpperCase()}: ${download.url}`).join("\n")}`
    : "";
  const downloadHtml = downloads.length
    ? `<h3>Your music downloads</h3><p>These private links are valid for 7 days and up to 10 downloads each.</p><ul>${downloads.map((download) => `<li><a href="${escapeHtml(download.url)}">Download ${download.format.toUpperCase()}</a></li>`).join("")}</ul>`
    : "";
  const videoText = videos.length
    ? `\n\nYour video access:\n${videos.map((video) => `Video: ${video.url}`).join("\n")}`
    : "";
  const videoHtml = videos.length
    ? `<h3>Your video</h3><p>This access is provided automatically after payment.</p><ul>${videos.map((video) => `<li><a href="${escapeHtml(video.url)}">${video.external ? "Open video" : "Download video"}</a></li>`).join("")}</ul>`
    : "";
  const deliveryText = address.length > 1
    ? `\n\nDelivery address:\n${address.join("\n")}`
    : "";
  const deliveryHtml = address.length > 1
    ? `<h3>Delivery address</h3><p>${address.map(escapeHtml).join("<br>")}</p>`
    : "";
  const now = new Date().toISOString();
  if (!order.confirmation_email_sent_at) {
    try {
      await sendTransactionalEmail({
        to: order.customer_email,
        subject: `Order confirmed — ${order.order_number}`,
        text: `Thanks for your order.\n\n${lines.join("\n")}\nDelivery: ${formatOrderMoney(order.shipping_total_minor, order.currency)}\nTotal: ${formatOrderMoney(order.total_minor, order.currency)}${downloadText}${videoText}${deliveryText}`,
        html: `<h2>Thanks for your order</h2><p><strong>${escapeHtml(order.order_number)}</strong></p><ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul><p>Delivery: ${escapeHtml(formatOrderMoney(order.shipping_total_minor, order.currency))}<br><strong>Total: ${escapeHtml(formatOrderMoney(order.total_minor, order.currency))}</strong></p>${downloadHtml}${videoHtml}${deliveryHtml}`,
        idempotencyKey: `order-customer-${order.id}`,
        tag: "shop-order-confirmation",
      });
      await db
        .prepare(`UPDATE shop_orders SET confirmation_email_sent_at = ?, updated_at = ? WHERE id = ?`)
        .bind(now, now, order.id)
        .run();
    } catch {
      // Payment remains authoritative even when an email provider is unavailable.
    }
  }

  if (!order.merchant_email_sent_at) {
    try {
      const configuredEmail =
        (await getRuntimeValue("ADMIN_EMAIL")) || "lucapisanumusic@gmail.com";
      const result = await db
        .prepare(`SELECT email FROM admin_users WHERE is_active = 1 ORDER BY role DESC, email ASC`)
        .all<{ email: string }>();
      const adminEmails = Array.from(new Set([
        configuredEmail.toLowerCase(),
        ...(result.results ?? []).map((row) => row.email.toLowerCase()),
      ]));
      await Promise.all(adminEmails.map((adminEmail) => sendTransactionalEmail({
          to: adminEmail,
          replyTo: order.customer_email,
          subject: `New shop order ${order.order_number}`,
          text: `${lines.join("\n")}\n\nTotal: ${formatOrderMoney(order.total_minor, order.currency)}\nCustomer: ${order.customer_first_name} ${order.customer_last_name}\n${order.customer_email}\n${order.customer_phone}${order.customer_message ? `\n\nBuyer message:\n${order.customer_message}` : ""}\n\n${address.join("\n")}`,
          html: `<h2>New paid order</h2><p><strong>${escapeHtml(order.order_number)}</strong></p><ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul><p><strong>Total: ${escapeHtml(formatOrderMoney(order.total_minor, order.currency))}</strong></p><p>${escapeHtml(order.customer_first_name)} ${escapeHtml(order.customer_last_name)}<br>${escapeHtml(order.customer_email)}<br>${escapeHtml(order.customer_phone)}</p>${order.customer_message ? `<h3>Buyer message</h3><p>${escapeHtml(order.customer_message).replaceAll("\n", "<br>")}</p>` : ""}<p>${address.map(escapeHtml).join("<br>")}</p>`,
          idempotencyKey: `order-merchant-${order.id}-${adminEmail}`,
          tag: "shop-new-order",
        })));
      await db
        .prepare(`UPDATE shop_orders SET merchant_email_sent_at = ?, updated_at = ? WHERE id = ?`)
        .bind(now, now, order.id)
        .run();
    } catch {
      // Admin can still see the paid order in D1.
    }
  }
}

export async function sendShippingEmail(db: D1Database, order: ShopOrderWithItems) {
  if (order.shipping_email_sent_at || !order.tracking_carrier || !order.tracking_number) return;
  await sendTransactionalEmail({
    to: order.customer_email,
    subject: `Your order ${order.order_number} has shipped`,
    text: `Your order has shipped.\n\nCarrier: ${order.tracking_carrier}\nTracking number: ${order.tracking_number}`,
    html: `<h2>Your order has shipped</h2><p><strong>${escapeHtml(order.order_number)}</strong></p><p>Carrier: ${escapeHtml(order.tracking_carrier)}<br>Tracking number: ${escapeHtml(order.tracking_number)}</p>`,
    idempotencyKey: `order-shipping-${order.id}`,
    tag: "shop-order-shipped",
  });
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE shop_orders SET shipping_email_sent_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, order.id)
    .run();
}
