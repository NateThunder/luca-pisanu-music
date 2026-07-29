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
  const isAlbumCover = product.categorySlug === "_music-release";

  return (
    <div
      className={`product-art product-art--${product.artwork}${isAlbumCover ? " product-art--album" : ""}`}
    >
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
      {!imageUrl ? (
        <>
          <span className="product-art__texture" />
          <span className="product-art__shape product-art__shape--one" />
          <span className="product-art__shape product-art__shape--two" />
          <span className="product-art__shape product-art__shape--three" />
          <span className="product-art__code">LP / GOODS / {product.id}</span>
        </>
      ) : null}
    </div>
  );
}
