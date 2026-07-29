import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/shop/CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout for the Luca Pisanu shop.",
};

export default async function ShopCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ buy?: string | string[] }>;
}) {
  const value = (await searchParams).buy;
  const buyProductId = Array.isArray(value) ? value[0] : value;
  return <CheckoutPageClient buyProductId={buyProductId} />;
}
