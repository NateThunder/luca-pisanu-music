"use client";

import { useShopCart } from "./ShopCartContext";

export function QuantityControls({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) {
  const { updateQuantity } = useShopCart();

  return (
    <div className="shop-quantity" aria-label="Update quantity">
      <button
        type="button"
        onClick={() => updateQuantity(productId, quantity - 1)}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span>{quantity}</span>
      <button
        type="button"
        onClick={() => updateQuantity(productId, quantity + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
