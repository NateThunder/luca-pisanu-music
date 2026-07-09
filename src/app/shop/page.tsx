import type { Metadata } from "next";
import Link from "next/link";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { PriceLabel } from "@/components/shop/PriceLabel";
import { ProductArtwork } from "@/components/ProductArtwork";
import { Reveal } from "@/components/Reveal";
import { ActionLink } from "@/components/ui";
import { getShopProducts } from "@/lib/shop-data";
import {
  getProductCategories,
  getProductHref,
  getProductSections,
  normalizeCategory,
} from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Music, printed material, artist merchandise and session work from Luca Pisanu.",
};

export const dynamic = "force-dynamic";

type ShopPageProps = {
  searchParams?: Promise<{
    category?: string | string[];
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const products = await getShopProducts();
  const requestedCategory = normalizeCategory(resolvedSearchParams.category);
  const categories = getProductCategories(products);
  const activeCategory =
    categories.find((category) => category.slug === requestedCategory) ?? null;
  const filteredProducts = activeCategory
    ? products.filter((product) => product.categorySlug === activeCategory.slug)
    : products;
  const productSections = getProductSections(filteredProducts, products);

  return (
    <>
      <Reveal>
        <section className="shop-catalogue poster-section" id="shop-products">
          <div className="shop-catalogue__header">
            <h2>Shop</h2>
          </div>

          <nav className="shop-filter" aria-label="Product categories">
            <Link
              className={!activeCategory ? "is-active" : ""}
              href="/shop"
              aria-current={!activeCategory ? "page" : undefined}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                className={activeCategory?.slug === category.slug ? "is-active" : ""}
                href={`/shop?category=${category.slug}`}
                key={category.slug}
                aria-current={
                  activeCategory?.slug === category.slug ? "page" : undefined
                }
              >
                {category.title}
              </Link>
            ))}
          </nav>

          {productSections.map((section) => (
            <section className="shop-product-section" key={section.slug}>
              <div className="shop-product-section__heading">
                <h3>{section.title}</h3>
                <span>
                  {section.items.length} item
                  {section.items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="shop-product-grid">
                {section.items.map((product, index) => (
                  <article className="product-item" key={product.id}>
                    <Link
                      className="product-item__art-link"
                      href={getProductHref(product)}
                      aria-label={`View ${product.name}`}
                    >
                      <ProductArtwork product={product} />
                    </Link>
                    <div className="product-item__body">
                      <span className="micro-label">
                        0{index + 1} / {product.category}
                      </span>
                      <h4>{product.name}</h4>
                      <p>{product.note}</p>
                      <div className="product-item__meta">
                        <PriceLabel
                          className="product-item__price"
                          product={product}
                        />
                        <span>{product.status}</span>
                      </div>
                      <div className="product-item__actions">
                        <AddToCartButton productId={product.id} compact />
                        <ActionLink
                          href={getProductHref(product)}
                          variant="text"
                        >
                          View product
                        </ActionLink>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>
      </Reveal>

    </>
  );
}
