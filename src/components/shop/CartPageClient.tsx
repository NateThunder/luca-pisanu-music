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
    removeCartItem,
    updateSupportAmount,
    subtotalLabel,
  } = useShopCart();

  if (lineItems.length === 0) {
    return (
      <section className="shop-system-page poster-section">
        <div className="shop-system-page__intro">
          <span className="micro-label">Cart / Empty</span>
          <h1>Your Cart Is Quiet.</h1>
          <p>
            Add an available product, then come back here to adjust quantities
            and continue to checkout.
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
          Your cart is stored in this browser. Prices use the currency selected
          from your location.
        </p>
      </div>

      <div className="shop-cart-layout">
        <div className="shop-cart-lines">
          {lineItems.map((item) => (
            <article className="shop-cart-line" key={item.cartItemId}>
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
                {item.variant ? <strong>{item.variant.label}</strong> : null}
                <p>{item.product.note}</p>
                <div className="shop-cart-line__controls">
                  {item.product.productType === "digital" && item.product.categorySlug === "_music-release" ? <label className="shop-cart-line__support-amount">
                    Your amount
                    <input min={item.product.prices[currency]} max="100" step="0.01" type="number" value={item.unitAmount.toFixed(2)} onChange={(event) => {
                      const amount = Number(event.target.value);
                      if (Number.isFinite(amount) && amount >= item.product.prices[currency] && amount <= 100) updateSupportAmount(item.cartItemId, Math.round(amount * 100));
                    }} />
                  </label> : <QuantityControls
                    productId={item.product.id}
                    variantId={item.variant?.id}
                    quantity={item.quantity}
                  />}
                  <button
                    type="button"
                    onClick={() => removeCartItem(item.cartItemId)}
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
            Delivery is calculated from the country entered at checkout. No VAT
            or tax is added.
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
