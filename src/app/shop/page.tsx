import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ProductArtwork } from "@/components/ProductArtwork";
import { Reveal } from "@/components/Reveal";
import { ActionLink, Arrow, Barcode } from "@/components/ui";
import { products } from "@/data/site";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Music, printed material, artist merchandise and session work from Luca Pisanu.",
};

export default function ShopPage() {
  return (
    <>
      <PageHero
        eyebrow="Physical & practical"
        title={
          <>
            Music You
            <br />
            Can <span className="outline-text">Hold.</span>
          </>
        }
        accent="Small runs. Real objects."
        copy="Limited music, printed ideas, artist goods and studio work made with the same independent spirit."
        actions={
          <ActionLink href={products[0].url} variant="primary">
            Browse the latest <Arrow />
          </ActionLink>
        }
        className="shop-hero"
        visual={
          <div className="shop-hero-art">
            <ProductArtwork product={products[0]} />
            <span className="shop-hero-ticket">
              Limited run
              <Barcode />
            </span>
          </div>
        }
      />

      <Reveal>
        <section className="shop-catalogue poster-section">
          <div className="section-heading">
            <div>
              <h2>From The Workshop</h2>
            </div>
            <span className="handwritten">Made in small numbers.</span>
          </div>
          <div className="product-grid">
            {products.map((product, index) => (
              <article className="product-item" key={product.id}>
                <ProductArtwork product={product} />
                <div className="product-item__body">
                  <span className="micro-label">
                    0{index + 1} / {product.category}
                  </span>
                  <h3>{product.name}</h3>
                  <p>{product.note}</p>
                  <div className="product-item__action">
                    <strong>{product.price ?? "Coming soon"}</strong>
                    <ActionLink href={product.url} variant="text">
                      View item
                    </ActionLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="shop-note poster-section">
          <div>
            <h2>Independent Means Intentional.</h2>
          </div>
          <div>
            <p className="lead-copy">
              The shop is designed for limited objects and direct creative
              work, not endless inventory.
            </p>
            <p>
              Product destinations, pricing, shipping and stock controls are
              ready to be connected when the real store details are available.
            </p>
          </div>
        </section>
      </Reveal>

      <section className="page-cta page-cta--mustard poster-section">
        <span className="handwritten">Looking for something specific?</span>
        <h2>Ask Luca Directly.</h2>
        <p>For physical releases, session work or availability.</p>
        <ActionLink href="/contact?type=music" variant="dark">
          Shop & music enquiries <Arrow />
        </ActionLink>
      </section>
    </>
  );
}
