import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/shop/CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Demo checkout summary for the Luca Pisanu shop prototype.",
};

export default function ShopCheckoutPage() {
  return <CheckoutPageClient />;
}
