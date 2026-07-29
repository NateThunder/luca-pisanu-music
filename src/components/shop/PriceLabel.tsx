"use client";

import type { Product } from "@/data/site";
import { useShopCart } from "./ShopCartContext";

export function PriceLabel({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const { currency, getProductPriceLabel } = useShopCart();

  return (
    <span className={className} title={`Price shown in ${currency}`}>
      {getProductPriceLabel(product)}
    </span>
  );
}
