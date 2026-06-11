"use client";

import { useEffect, useRef, useState } from "react";
import { useShopCart } from "./ShopCartContext";

export function AddToCartButton({
  productId,
  className = "",
  compact = false,
}: {
  productId: string;
  className?: string;
  compact?: boolean;
}) {
  const { addItem, getQuantity } = useShopCart();
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const quantity = getQuantity(productId);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    addItem(productId);
    setAdded(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setAdded(false);
      timeoutRef.current = null;
    }, 1100);
  };

  return (
    <button
      className={`shop-add-button ${compact ? "shop-add-button--compact" : ""} ${className}`.trim()}
      type="button"
      onClick={handleClick}
      data-added={added ? "true" : "false"}
      aria-label={quantity > 0 ? "Add another to cart" : "Add to cart"}
    >
      {added ? "Added" : quantity > 0 ? `Add Another (${quantity})` : "Add to Cart"}
    </button>
  );
}
