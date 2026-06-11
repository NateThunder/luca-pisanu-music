"use client";

import Link from "next/link";
import { useShopCart } from "./ShopCartContext";

export function FloatingCartButton() {
  const { itemCount, subtotalLabel } = useShopCart();

  return (
    <Link
      className={`floating-cart ${itemCount > 0 ? "has-items" : ""}`}
      href="/shop/cart"
      aria-label={`Open cart with ${itemCount} item${itemCount === 1 ? "" : "s"}`}
    >
      <span className="floating-cart__count">{itemCount}</span>
      <span>
        <strong>Cart</strong>
        <small>{itemCount > 0 ? subtotalLabel : "Empty"}</small>
      </span>
    </Link>
  );
}
