"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ProductVariant } from "@/data/site";
import { useShopCart } from "./ShopCartContext";

export function AddToCartButton({
  productId,
  className = "",
  compact = false,
  saleMode = "purchase",
  variants = [],
  inStock = true,
}: {
  productId: string;
  className?: string;
  compact?: boolean;
  saleMode?: "purchase" | "enquiry" | "unavailable";
  variants?: ProductVariant[];
  inStock?: boolean;
}) {
  const { addItem, getQuantity } = useShopCart();
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const quantity = getQuantity(productId);
  const availableVariants = variants.filter((variant) => variant.isAvailable);
  const [variantId, setVariantId] = useState(availableVariants[0]?.id ?? "");

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    addItem(productId, 1, variantId || null);
    setAdded(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setAdded(false);
      timeoutRef.current = null;
    }, 1100);
  };

  if (saleMode === "enquiry") {
    return (
      <Link className="shop-add-button" href="/contact?type=music">
        Enquire
      </Link>
    );
  }

  if (saleMode === "unavailable" || !inStock) {
    return <button className="shop-add-button" type="button" disabled>Unavailable</button>;
  }

  if (compact && availableVariants.length) {
    return (
      <Link className="shop-add-button shop-add-button--compact" href={`/shop/${productId}`}>
        Choose options
      </Link>
    );
  }

  return (
    <div className="shop-add-control">
      {availableVariants.length ? (
        <label>
          <span>Choose option</span>
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            {availableVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>{variant.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <button
      className={`shop-add-button ${compact ? "shop-add-button--compact" : ""} ${className}`.trim()}
      type="button"
      onClick={handleClick}
      disabled={variants.length > 0 && availableVariants.length === 0}
      data-added={added ? "true" : "false"}
      aria-label={quantity > 0 ? "Add another to cart" : "Add to cart"}
    >
      {added ? "Added" : quantity > 0 ? `Add Another (${quantity})` : "Add to Cart"}
      </button>
    </div>
  );
}
