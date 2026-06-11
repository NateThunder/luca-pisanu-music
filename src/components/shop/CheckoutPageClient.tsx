"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/shop";
import { useShopCart } from "./ShopCartContext";

export function CheckoutPageClient() {
  const { currency, lineItems, subtotalLabel } = useShopCart();

  return (
    <section className="shop-system-page shop-checkout poster-section">
      <div className="shop-system-page__intro">
        <span className="micro-label">Checkout / Opening soon</span>
        <h1>Store Opening Soon.</h1>
        <p>
          This prototype stops before payment. Use the summary to test the
          buying flow, then contact Luca about availability, preorders or
          session work.
        </p>
      </div>

      <div className="shop-checkout__panel">
        <div className="shop-checkout__summary">
          <span className="micro-label">Demo order</span>
          {lineItems.length > 0 ? (
            <ul>
              {lineItems.map((item) => (
                <li key={item.product.id}>
                  <span>
                    {item.quantity} x {item.product.name}
                  </span>
                  <strong>{formatPrice(item.lineAmount, currency)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Your cart is empty. Add a product before testing checkout.</p>
          )}
          <div className="shop-checkout__total">
            <span>Subtotal</span>
            <strong>{subtotalLabel}</strong>
          </div>
        </div>

        <div className="shop-checkout__message">
          <span className="handwritten">No payment taken.</span>
          <h2>Ask Before Launch.</h2>
          <p>
            For vinyl availability, merch sizing, printed material or a remote
            guitar session, send Luca a direct enquiry.
          </p>
          <Link
            className="action-link action-link--primary"
            href="/contact?type=music"
          >
            Notify interest
          </Link>
          <Link className="action-link" href="/shop">
            Back to shop
          </Link>
        </div>
      </div>
    </section>
  );
}
