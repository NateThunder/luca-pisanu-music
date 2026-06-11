"use client";

import Link from "next/link";
import { ProductArtwork } from "@/components/ProductArtwork";
import { formatPrice, getProductHref } from "@/lib/shop";
import { QuantityControls } from "./QuantityControls";
import { useShopCart } from "./ShopCartContext";

export function CartPageClient() {
  const {
    clearCart,
    currency,
    lineItems,
    removeItem,
    subtotalLabel,
  } = useShopCart();

  if (lineItems.length === 0) {
    return (
      <section className="shop-system-page poster-section">
        <div className="shop-system-page__intro">
          <span className="micro-label">Cart / Empty</span>
          <h1>Your Cart Is Quiet.</h1>
          <p>
            Add a demo product to test the store flow, then come back here to
            adjust quantities and continue to checkout.
          </p>
          <Link className="action-link action-link--primary" href="/shop">
            Browse shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shop-system-page poster-section">
      <div className="shop-system-page__intro">
        <span className="micro-label">Cart / {currency}</span>
        <h1>Review The Run.</h1>
        <p>
          Demo cart state is stored locally in this browser. Prices update from
          the region-aware display currency.
        </p>
      </div>

      <div className="shop-cart-layout">
        <div className="shop-cart-lines">
          {lineItems.map((item) => (
            <article className="shop-cart-line" key={item.product.id}>
              <Link
                className="shop-cart-line__art"
                href={getProductHref(item.product)}
                aria-label={`View ${item.product.name}`}
              >
                <ProductArtwork product={item.product} />
              </Link>
              <div className="shop-cart-line__body">
                <span className="micro-label">{item.product.category}</span>
                <h2>{item.product.name}</h2>
                <p>{item.product.note}</p>
                <div className="shop-cart-line__controls">
                  <QuantityControls
                    productId={item.product.id}
                    quantity={item.quantity}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="shop-cart-line__price">
                <span>{formatPrice(item.unitAmount, currency)} each</span>
                <strong>{formatPrice(item.lineAmount, currency)}</strong>
              </div>
            </article>
          ))}
        </div>

        <aside className="shop-cart-summary">
          <span className="micro-label">Summary</span>
          <div>
            <span>Subtotal</span>
            <strong>{subtotalLabel}</strong>
          </div>
          <p>
            Shipping, tax and real payment handling are intentionally disabled
            in this prototype.
          </p>
          <Link className="action-link action-link--primary" href="/shop/checkout">
            Continue to checkout
          </Link>
          <Link className="action-link" href="/shop">
            Continue shopping
          </Link>
          <button
            className="shop-cart-summary__clear"
            type="button"
            onClick={clearCart}
          >
            Clear cart
          </button>
        </aside>
      </div>
    </section>
  );
}
