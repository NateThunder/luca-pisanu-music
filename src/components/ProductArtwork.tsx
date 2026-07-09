import Image from "next/image";
import type { Product } from "@/data/site";

export function ProductArtwork({
  product,
  side = "front",
}: {
  product: Product;
  side?: "front" | "back";
}) {
  const imageUrl =
    side === "back" ? product.backArtworkUrl : product.frontArtworkUrl;

  return (
    <div className={`product-art product-art--${product.artwork}`}>
      {imageUrl ? (
        <Image
          alt={product.artworkAlt || product.name}
          className="product-art__image"
          fill
          sizes="(max-width: 760px) 100vw, 30vw"
          src={imageUrl}
          unoptimized
        />
      ) : null}
      <span className="product-art__texture" />
      {!imageUrl ? (
        <>
          <span className="product-art__shape product-art__shape--one" />
          <span className="product-art__shape product-art__shape--two" />
          <span className="product-art__shape product-art__shape--three" />
        </>
      ) : null}
      <span className="product-art__code">LP / GOODS / {product.id}</span>
    </div>
  );
}
