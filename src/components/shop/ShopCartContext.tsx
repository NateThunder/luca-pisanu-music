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
import type { CurrencyCode, Product } from "@/data/site";
import {
  detectCurrencyFromLocales,
  fallbackCurrency,
  formatPrice,
  getProductById,
  getProductPrice,
} from "@/lib/shop";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

export type CartLineItem = {
  product: Product;
  quantity: number;
  unitAmount: number;
  lineAmount: number;
};

type ShopCartContextValue = {
  currency: CurrencyCode;
  itemCount: number;
  lineItems: CartLineItem[];
  subtotalAmount: number;
  subtotalLabel: string;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

function parseStoredCart(value: string | null): StoredCartItem[] {
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

        if (!getProductById(item.productId)) return null;

        return {
          productId: item.productId,
          quantity: normalizeQuantity(item.quantity),
        };
      })
      .filter((item): item is StoredCartItem => item !== null);
  } catch {
    return [];
  }
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>(fallbackCurrency);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCartItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));
      setCurrency(
        detectCurrencyFromLocales(
          navigator.languages?.length
            ? navigator.languages
            : [navigator.language],
        ),
      );
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    if (!getProductById(productId)) return;

    setCartItems((currentItems) => {
      const requestedQuantity = normalizeQuantity(quantity);
      const existingItem = currentItems.find(
        (item) => item.productId === productId,
      );

      if (!existingItem) {
        return [...currentItems, { productId, quantity: requestedQuantity }];
      }

      return currentItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: normalizeQuantity(item.quantity + requestedQuantity),
            }
          : item,
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: normalizeQuantity(quantity) }
          : item,
      ),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getQuantity = useCallback(
    (productId: string) =>
      cartItems.find((item) => item.productId === productId)?.quantity ?? 0,
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
          const product = getProductById(item.productId);
          if (!product) return null;

          const unitAmount = getProductPrice(product, currency);
          return {
            product,
            quantity: item.quantity,
            unitAmount,
            lineAmount: unitAmount * item.quantity,
          };
        })
        .filter((item): item is CartLineItem => item !== null),
    [cartItems, currency],
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
      clearCart,
      currency,
      getProductPriceLabel,
      getQuantity,
      itemCount,
      lineItems,
      removeItem,
      subtotalAmount,
      subtotalLabel,
      updateQuantity,
    }),
    [
      addItem,
      clearCart,
      currency,
      getProductPriceLabel,
      getQuantity,
      itemCount,
      lineItems,
      removeItem,
      subtotalAmount,
      subtotalLabel,
      updateQuantity,
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
