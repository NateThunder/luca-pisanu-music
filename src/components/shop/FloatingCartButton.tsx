"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShopCart } from "./ShopCartContext";

export function FloatingCartButton() {
  const { itemCount, subtotalLabel } = useShopCart();
  const pathname = usePathname();
  const isShopPage = pathname === "/shop" || pathname.startsWith("/shop/");

  if (!isShopPage && itemCount === 0) return null;

  return (
    <Link
      className={`floating-cart ${itemCount > 0 ? "has-items" : ""}`}
      href="/shop/cart"
      aria-label={`Open cart with ${itemCount} item${itemCount === 1 ? "" : "s"}`}
    >
      <svg
        aria-hidden="true"
        className="floating-cart__icon"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
      </svg>
      <span className="floating-cart__count">{itemCount}</span>
      <span className="floating-cart__details">
        <strong>Cart</strong>
        <small>{itemCount > 0 ? subtotalLabel : "Empty"}</small>
      </span>
    </Link>
  );
}
