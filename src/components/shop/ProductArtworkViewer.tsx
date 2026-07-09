"use client";

import { useState } from "react";
import type { Product } from "@/data/site";
import { ProductArtwork } from "@/components/ProductArtwork";

export function ProductArtworkViewer({ product }: { product: Product }) {
  const hasBack = Boolean(product.backArtworkUrl);
  const [side, setSide] = useState<"front" | "back">("front");

  function rotate() {
    if (!hasBack) return;
    setSide((current) => (current === "front" ? "back" : "front"));
  }

  return (
    <div className="product-art-viewer">
      <ProductArtwork product={product} side={side} />
      {hasBack ? (
        <div className="product-art-viewer__controls" aria-label="Product artwork sides">
          <button
            aria-label="Show previous side"
            onClick={rotate}
            type="button"
          >
            &larr;
          </button>
          <span>{side === "front" ? "Front" : "Back"}</span>
          <button
            aria-label="Show next side"
            onClick={rotate}
            type="button"
          >
            &rarr;
          </button>
        </div>
      ) : null}
    </div>
  );
}
