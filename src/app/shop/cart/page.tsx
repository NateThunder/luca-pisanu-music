import type { Metadata } from "next";
import { CartPageClient } from "@/components/shop/CartPageClient";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review shop cart items for Luca Pisanu.",
};

export default function ShopCartPage() {
  return <CartPageClient />;
}
