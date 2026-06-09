import type { Product } from "@/data/site";

export function ProductArtwork({ product }: { product: Product }) {
  return (
    <div className={`product-art product-art--${product.artwork}`}>
      <span className="product-art__texture" />
      <span className="product-art__shape product-art__shape--one" />
      <span className="product-art__shape product-art__shape--two" />
      <span className="product-art__shape product-art__shape--three" />
      <span className="product-art__code">LP / GOODS / {product.id}</span>
    </div>
  );
}

