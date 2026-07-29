"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CurrencyCode, Product, ProductVariant } from "@/data/site";
import {
  formatPrice,
  getProductPrice,
  isProductInStock,
} from "@/lib/shop";

type StoredCartItem = {
  lineId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  chosenAmountMinor: number | null;
};

export type CartLineItem = {
  product: Product;
  variant: ProductVariant | null;
  cartItemId: string;
  quantity: number;
  unitAmount: number;
  lineAmount: number;
};

type ShopCartContextValue = {
  currency: CurrencyCode;
  hydrated: boolean;
  itemCount: number;
  lineItems: CartLineItem[];
  subtotalAmount: number;
  subtotalLabel: string;
  addItem: (productId: string, quantity?: number, variantId?: string | null) => void;
  addSupportItem: (productId: string, chosenAmountMinor: number) => void;
  replaceCartWithItem: (productId: string) => boolean;
  removeItem: (productId: string, variantId?: string | null) => void;
  removeCartItem: (cartItemId: string) => void;
  updateSupportAmount: (cartItemId: string, chosenAmountMinor: number) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  getQuantity: (productId: string) => number;
  getProductPriceLabel: (product: Product) => string;
};

const STORAGE_KEY = "luca-shop-cart-v1";
const ShopCartContext = createContext<ShopCartContextValue | null>(null);

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(99, Math.floor(quantity)));
}

function findProduct(products: Product[], productId: string) {
  return products.find((product) => product.id === productId) ?? null;
}

function itemId(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? ""}`;
}

function newLineId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseStoredCart(
  value: string | null,
  products: Product[],
): StoredCartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          !("productId" in item) ||
          !("quantity" in item) ||
          typeof item.productId !== "string" ||
          typeof item.quantity !== "number"
        ) {
          return null;
        }

        const product = findProduct(products, item.productId);
        if (
          !product ||
          (product.saleMode ?? "purchase") !== "purchase" ||
          !isProductInStock(product)
        ) return null;
        const variantId =
          "variantId" in item && typeof item.variantId === "string"
            ? item.variantId
            : null;
        if (
          (product?.variants?.length && !variantId) ||
          (variantId &&
            !product?.variants?.some(
              (variant) => variant.id === variantId && variant.isAvailable,
            ))
        ) {
          return null;
        }

        return {
          lineId: "lineId" in item && typeof item.lineId === "string" ? item.lineId : newLineId(),
          productId: item.productId,
          variantId,
          quantity: normalizeQuantity(item.quantity),
          chosenAmountMinor: "chosenAmountMinor" in item && typeof item.chosenAmountMinor === "number"
            ? Math.max(0, Math.min(10_000, Math.round(item.chosenAmountMinor)))
            : null,
        };
      })
      .filter((item): item is StoredCartItem => item !== null);
  } catch {
    return [];
  }
}

export function ShopCartProvider({
  children,
  products,
  currency,
}: {
  children: ReactNode;
  products: Product[];
  currency: CurrencyCode;
}) {
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCartItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY), products));
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [products]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  const addItem = useCallback((productId: string, quantity = 1, variantId: string | null = null) => {
    const product = findProduct(products, productId);
    if (!product || (product.saleMode ?? "purchase") !== "purchase") return;
    if (product.variants?.length && !product.variants.some((variant) => variant.id === variantId && variant.isAvailable)) return;

    setCartItems((currentItems) => {
      const requestedQuantity = normalizeQuantity(quantity);
      const existingItem = currentItems.find(
        (item) => itemId(item.productId, item.variantId) === itemId(productId, variantId),
      );

      if (!existingItem) {
        return [...currentItems, { lineId: newLineId(), productId, variantId, quantity: requestedQuantity, chosenAmountMinor: null }];
      }

      return currentItems.map((item) =>
        itemId(item.productId, item.variantId) === itemId(productId, variantId)
          ? {
              ...item,
              quantity: normalizeQuantity(item.quantity + requestedQuantity),
            }
          : item,
      );
    });
  }, [products]);

  const addSupportItem = useCallback((productId: string, chosenAmountMinor: number) => {
    const product = findProduct(products, productId);
    if (!product || product.productType !== "digital" || product.categorySlug !== "_music-release") return;
    setCartItems((items) => [...items, {
      lineId: newLineId(), productId, variantId: null, quantity: 1,
      chosenAmountMinor: Math.max(0, Math.min(10_000, Math.round(chosenAmountMinor))),
    }]);
  }, [products]);

  const removeItem = useCallback((productId: string, variantId: string | null = null) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => itemId(item.productId, item.variantId) !== itemId(productId, variantId)),
    );
  }, []);

  const removeCartItem = useCallback((cartItemId: string) => {
    setCartItems((items) => items.filter((item) => item.lineId !== cartItemId));
  }, []);

  const updateSupportAmount = useCallback((cartItemId: string, chosenAmountMinor: number) => {
    setCartItems((items) => items.map((item) => item.lineId === cartItemId
      ? { ...item, chosenAmountMinor: Math.max(0, Math.min(10_000, Math.round(chosenAmountMinor))) }
      : item));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId: string | null = null) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        itemId(item.productId, item.variantId) === itemId(productId, variantId)
          ? { ...item, quantity: normalizeQuantity(quantity) }
          : item,
      ),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const replaceCartWithItem = useCallback((productId: string) => {
    const product = findProduct(products, productId);
    if (
      !product ||
      (product.saleMode ?? "purchase") !== "purchase" ||
      !isProductInStock(product) ||
      product.variants?.length
    ) return false;
    setCartItems([{ lineId: newLineId(), productId, variantId: null, quantity: 1, chosenAmountMinor: null }]);
    return true;
  }, [products]);

  const getQuantity = useCallback(
    (productId: string) =>
      cartItems
        .filter((item) => item.productId === productId)
        .reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  const getProductPriceLabel = useCallback(
    (product: Product) => formatPrice(getProductPrice(product, currency), currency),
    [currency],
  );

  const lineItems = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = findProduct(products, item.productId);
          if (!product) return null;
          const variant = item.variantId
            ? product.variants?.find((candidate) => candidate.id === item.variantId) ?? null
            : null;

          const unitAmount = item.chosenAmountMinor === null
            ? getProductPrice(product, currency)
            : item.chosenAmountMinor / 100;
          return {
            product,
            variant,
            cartItemId: item.lineId,
            quantity: item.quantity,
            unitAmount,
            lineAmount: unitAmount * item.quantity,
          };
        })
        .filter((item): item is CartLineItem => item !== null),
    [cartItems, currency, products],
  );

  const itemCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );
  const subtotalAmount = useMemo(
    () => lineItems.reduce((total, item) => total + item.lineAmount, 0),
    [lineItems],
  );
  const subtotalLabel = formatPrice(subtotalAmount, currency);

  const value = useMemo<ShopCartContextValue>(
    () => ({
      addItem,
      addSupportItem,
      clearCart,
      currency,
      hydrated,
      getProductPriceLabel,
      getQuantity,
      itemCount,
      lineItems,
      removeItem,
      removeCartItem,
      replaceCartWithItem,
      subtotalAmount,
      subtotalLabel,
      updateQuantity,
      updateSupportAmount,
    }),
    [
      addItem,
      addSupportItem,
      clearCart,
      currency,
      getProductPriceLabel,
      getQuantity,
      hydrated,
      itemCount,
      lineItems,
      removeItem,
      removeCartItem,
      replaceCartWithItem,
      subtotalAmount,
      subtotalLabel,
      updateQuantity,
      updateSupportAmount,
    ],
  );

  return (
    <ShopCartContext.Provider value={value}>
      {children}
    </ShopCartContext.Provider>
  );
}

export function useShopCart() {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error("useShopCart must be used inside ShopCartProvider.");
  }

  return context;
}
