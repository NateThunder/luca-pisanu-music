import type { ReactNode } from "react";
import { FloatingCartButton } from "@/components/shop/FloatingCartButton";
import { ShopCartProvider } from "@/components/shop/ShopCartContext";
import { getShopProducts } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const products = await getShopProducts();

  return (
    <ShopCartProvider products={products}>
      {children}
      <FloatingCartButton />
    </ShopCartProvider>
  );
}
