import { products, type CurrencyCode, type Product } from "@/data/site";

export type ProductCategory = {
  slug: string;
  title: string;
};

export type ProductSection = ProductCategory & {
  items: Product[];
};

const EURO_REGIONS = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
]);

export const fallbackCurrency: CurrencyCode = "GBP";

export function getProductHref(product: Product) {
  return `/shop/${product.id}`;
}

export function getProductById(productId: string) {
  return products.find((product) => product.id === productId) ?? null;
}

export function getProductCategories(): ProductCategory[] {
  const categories = new Map<string, string>();

  for (const product of products) {
    if (!categories.has(product.categorySlug)) {
      categories.set(product.categorySlug, product.category);
    }
  }

  return Array.from(categories, ([slug, title]) => ({ slug, title }));
}

export function getProductSections(filteredProducts = products): ProductSection[] {
  return getProductCategories()
    .map((category) => ({
      ...category,
      items: filteredProducts.filter(
        (product) => product.categorySlug === category.slug,
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function normalizeCategory(input?: string | string[]) {
  const value = Array.isArray(input) ? input[0] : input;
  return value?.trim().toLowerCase() ?? "";
}

export function detectCurrencyFromLocale(locale?: string | null): CurrencyCode {
  if (!locale) return fallbackCurrency;

  const region = locale
    .split("-")
    .at(-1)
    ?.trim()
    .toUpperCase();

  if (region === "GB") return "GBP";
  if (region === "US") return "USD";
  if (region && EURO_REGIONS.has(region)) return "EUR";
  return fallbackCurrency;
}

export function detectCurrencyFromLocales(locales: readonly string[]) {
  for (const locale of locales) {
    const currency = detectCurrencyFromLocale(locale);
    if (currency !== fallbackCurrency) return currency;
  }

  return detectCurrencyFromLocale(locales[0]);
}

export function formatPrice(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, {
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

export function getProductPrice(product: Product, currency: CurrencyCode) {
  return product.prices[currency] ?? product.prices[fallbackCurrency];
}
