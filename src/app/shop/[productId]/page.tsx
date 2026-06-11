import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { PriceLabel } from "@/components/shop/PriceLabel";
import { ProductArtwork } from "@/components/ProductArtwork";
import { ActionLink, Arrow, Barcode } from "@/components/ui";
import { products } from "@/data/site";
import { getProductById, getProductHref } from "@/lib/shop";

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export function generateStaticParams() {
  return products.map((product) => ({
    productId: product.id,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.name,
    description: product.note,
  };
}

export default async function ShopProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) notFound();

  const relatedProducts = products
    .filter(
      (relatedProduct) =>
        relatedProduct.categorySlug === product.categorySlug &&
        relatedProduct.id !== product.id,
    )
    .slice(0, 2);
  const fallbackRelatedProducts =
    relatedProducts.length > 0
      ? relatedProducts
      : products
          .filter((relatedProduct) => relatedProduct.id !== product.id)
          .slice(0, 2);

  return (
    <>
      <article className="shop-product-detail poster-section">
        <div className="shop-product-detail__visual">
          <ProductArtwork product={product} />
          <span className="shop-product-detail__ticket">
            {product.category}
            <Barcode />
          </span>
        </div>

        <div className="shop-product-detail__content">
          <span className="micro-label">Shop / {product.category}</span>
          <h1>{product.name}</h1>
          <p className="lead-copy">{product.note}</p>
          <p>{product.description}</p>

          <div className="shop-product-detail__price">
            <PriceLabel product={product} />
            <span>{product.status}</span>
          </div>

          <div className="shop-product-detail__actions">
            <AddToCartButton productId={product.id} />
            <ActionLink href="/shop/cart" variant="primary">
              View cart <Arrow />
            </ActionLink>
            <ActionLink href="/shop">Back to shop</ActionLink>
          </div>
        </div>
      </article>

      <section className="shop-related poster-section">
        <div className="shop-product-section__heading">
          <h2>Keep Browsing</h2>
          <span>{fallbackRelatedProducts.length} picks</span>
        </div>
        <div className="shop-related__grid">
          {fallbackRelatedProducts.map((relatedProduct) => (
            <Link
              className="shop-related__item"
              href={getProductHref(relatedProduct)}
              key={relatedProduct.id}
            >
              <ProductArtwork product={relatedProduct} />
              <span>{relatedProduct.category}</span>
              <strong>{relatedProduct.name}</strong>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
