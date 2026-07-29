"use client";

import {
  PayPalGuestPaymentButton,
  PayPalOneTimePaymentButton,
  PayPalProvider,
} from "@paypal/react-paypal-js/sdk-v6";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { countryOptions } from "@/data/countries";
import { formatPrice } from "@/lib/shop";
import { useShopCart } from "./ShopCartContext";

type Address = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
};

type Quote = {
  currency: "GBP" | "EUR" | "USD";
  itemTotalMinor: number;
  shippingTotalMinor: number;
  totalMinor: number;
  requiresShipping: boolean;
};

type PaymentConfig = {
  clientId: string;
  environment: "production" | "sandbox";
};

const emptyAddress: Address = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: "",
};

const pendingPayPalOrderKey = "luca-pending-paypal-order";

function responseError(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

type DownloadLink = {
  format: "mp3" | "wav" | "video";
  originalFilename: string;
  url: string;
  external?: boolean;
};

export function CheckoutPageClient({ buyProductId }: { buyProductId?: string }) {
  const {
    clearCart,
    currency,
    hydrated,
    lineItems,
    removeItem,
    replaceCartWithItem,
    subtotalAmount,
  } = useShopCart();
  const countries = useMemo(() => countryOptions(), []);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [message, setMessage] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [quotePending, setQuotePending] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentUncertain, setPaymentUncertain] = useState(false);
  const [completedOrder, setCompletedOrder] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [downloads, setDownloads] = useState<DownloadLink[]>([]);
  const [directReady, setDirectReady] = useState(!buyProductId);
  const directInitialized = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (window.sessionStorage.getItem(pendingPayPalOrderKey)) {
        setPaymentUncertain(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!buyProductId || !hydrated || directInitialized.current) return;
    const timeout = window.setTimeout(() => {
      if (directInitialized.current) return;
      directInitialized.current = true;
      if (!replaceCartWithItem(buyProductId)) {
        setMessage("This release is not currently available to buy.");
      }
      setDirectReady(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [buyProductId, hydrated, replaceCartWithItem]);

  const cart = useMemo(
    () =>
      lineItems.map((item) => ({
        productId: item.product.id,
        variantId: item.variant?.id ?? null,
        quantity: item.quantity,
        chosenAmountMinor: item.product.productType === "digital" && item.product.categorySlug === "_music-release"
          ? Math.round(item.unitAmount * 100)
          : null,
      })),
    [lineItems],
  );
  const requiresShipping = lineItems.some((item) => item.product.productType !== "digital");
  const displayCurrency = currency;
  const subtotalLabel = formatPrice(subtotalAmount, displayCurrency);
  const addressReady = Boolean(
    address.firstName &&
      address.lastName &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email) &&
      (!requiresShipping || Boolean(address.phone && address.line1 && address.city && address.postalCode && address.countryCode)),
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/shop/paypal/config", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as PaymentConfig & {
          ok?: boolean;
          message?: string;
        };
        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Payments are not configured.");
        }
        setConfig({ clientId: result.clientId, environment: result.environment });
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setMessage((error as Error).message);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!addressReady || !cart.length || completedOrder) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setQuotePending(true);
      void fetch("/api/shop/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, cart }),
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          const result = (await response.json()) as Quote & {
            ok?: boolean;
            message?: string;
            unavailableProductIds?: string[];
          };
          if (!response.ok || !result.ok) {
            setUnavailable(result.unavailableProductIds ?? []);
            throw new Error(responseError(result, "Delivery cannot be calculated."));
          }
          setMessage("");
          setQuote(result);
        })
        .catch((error) => {
          if ((error as Error).name !== "AbortError") {
            setMessage((error as Error).message);
          }
        })
        .finally(() => setQuotePending(false));
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [address, addressReady, cart, completedOrder]);

  function updateAddress(name: keyof Address, value: string) {
    setQuote(null);
    setUnavailable([]);
    setAddress((current) => ({ ...current, [name]: value }));
  }

  function removeUnavailableProduct(productId: string, variantId: string | null) {
    setQuote(null);
    setUnavailable([]);
    removeItem(productId, variantId);
  }

  async function createOrder() {
    if (!addressReady || !cart.length || !quote) {
      throw new Error(`Complete the ${requiresShipping ? "delivery" : "contact"} form before paying.`);
    }
    setPaymentPending(true);
    setMessage("");
    const response = await fetch("/api/shop/paypal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, cart, orderMessage }),
      cache: "no-store",
    });
    const result = (await response.json()) as {
      ok?: boolean;
      orderId?: string;
      message?: string;
      unavailableProductIds?: string[];
    };
    if (!response.ok || !result.ok || !result.orderId) {
      setPaymentPending(false);
      setUnavailable(result.unavailableProductIds ?? []);
      const error = responseError(result, "PayPal checkout could not start.");
      setMessage(error);
      throw new Error(error);
    }
    window.sessionStorage.setItem(pendingPayPalOrderKey, result.orderId);
    setPaymentUncertain(false);
    return { orderId: result.orderId };
  }

  async function completeFreeOrder() {
    if (!addressReady || !cart.length || !quote || quote.totalMinor !== 0) return;
    setPaymentPending(true); setMessage("");
    const response = await fetch("/api/shop/checkout/free", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, cart, orderMessage }), cache: "no-store",
    });
    const result = await response.json() as { ok?: boolean; orderNumber?: string; customerEmail?: string; downloads?: DownloadLink[]; message?: string };
    if (!response.ok || !result.ok || !result.orderNumber) {
      setPaymentPending(false); setMessage(responseError(result, "The free download could not be prepared.")); return;
    }
    clearCart(); setDownloads(result.downloads ?? []); setCompletedOrder(result.orderNumber);
    setConfirmationEmail(result.customerEmail || address.email); setPaymentPending(false);
  }

  async function captureOrder(data: { orderId: string }) {
    setPaymentPending(true);
    const response = await fetch(
      `/api/shop/paypal/orders/${encodeURIComponent(data.orderId)}/capture`,
      { method: "POST", cache: "no-store" },
    );
    const result = (await response.json()) as {
      ok?: boolean;
      orderNumber?: string;
      customerEmail?: string;
      downloads?: DownloadLink[];
      message?: string;
    };
    if (!response.ok || !result.ok || !result.orderNumber) {
      setPaymentPending(false);
      setPaymentUncertain(true);
      const error = responseError(result, "Payment could not be completed.");
      setMessage(error);
      throw new Error(error);
    }
    clearCart();
    window.sessionStorage.removeItem(pendingPayPalOrderKey);
    setDownloads(result.downloads ?? []);
    setCompletedOrder(result.orderNumber);
    setConfirmationEmail(result.customerEmail || address.email);
    setMessage("");
    setPaymentPending(false);
  }

  if (!directReady) {
    return (
      <section className="shop-system-page shop-checkout poster-section">
        <div className="shop-system-page__intro">
          <span className="micro-label">Secure checkout</span>
          <h1>Preparing Your Release.</h1>
        </div>
      </section>
    );
  }

  if (completedOrder) {
    return (
      <section className="shop-system-page shop-checkout poster-section">
        <div className="shop-checkout__message shop-checkout__complete">
          <span className="handwritten">Payment received.</span>
          <h1>Thank You.</h1>
          <p>
            Your order number is <strong>{completedOrder}</strong>. A confirmation
            is being sent to {confirmationEmail}; {requiresShipping ? "tracking will follow after dispatch." : "your private access links are included."}
          </p>
          {downloads.length ? (
            <div className="shop-checkout__downloads">
              <h2>Your downloads</h2>
              <p>Uploaded files are available for 7 days, with up to 10 downloads each.</p>
              <div className="hero-actions">
                {downloads.map((download) => (
                  <a
                    className="action-link action-link--primary"
                    href={download.url}
                    key={download.format}
                    download={download.external ? undefined : download.originalFilename}
                    rel={download.external ? "noreferrer" : undefined}
                    target={download.external ? "_blank" : undefined}
                  >
                    {download.external ? "Open" : "Download"} {download.format.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          <Link className="action-link" href={buyProductId ? "/music" : "/shop"}>
            Back to {buyProductId ? "music" : "shop"}
          </Link>
        </div>
      </section>
    );
  }

  if (!lineItems.length) {
    return (
      <section className="shop-system-page shop-checkout poster-section">
        <div className="shop-system-page__intro">
          <span className="micro-label">Checkout</span>
          <h1>Your Cart Is Empty.</h1>
          <Link className="action-link action-link--primary" href="/shop">Browse the shop</Link>
        </div>
      </section>
    );
  }

  const paymentDisabled = !quote || quotePending || paymentPending || paymentUncertain;

  return (
    <section className="shop-system-page shop-checkout poster-section">
      <div className="shop-system-page__intro">
        <span className="micro-label">Secure checkout</span>
        <h1>{requiresShipping ? "Delivery & Payment." : "Details & Payment."}</h1>
        <p>{requiresShipping ? "Enter the delivery address, review the total, then pay through PayPal." : "Enter your email, review the total, then pay through PayPal. Your music links arrive after payment."}</p>
      </div>

      <div className="shop-checkout__panel">
        <div className="shop-checkout__summary">
          <span className="micro-label">Your order</span>
          <ul>
            {lineItems.map((item) => (
              <li className={unavailable.includes(item.product.id) ? "is-unavailable" : ""} key={item.cartItemId}>
                <span>
                  {item.quantity} × {item.product.name}
                  {item.variant ? <small>{item.variant.label}</small> : null}
                </span>
                <strong>{formatPrice(item.lineAmount, displayCurrency)}</strong>
                {unavailable.includes(item.product.id) ? (
                  <button
                    className="shop-checkout__remove"
                    onClick={() => removeUnavailableProduct(item.product.id, item.variant?.id ?? null)}
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="shop-checkout__totals">
            <p><span>Items</span><strong>{subtotalLabel}</strong></p>
            <p>
              <span>Delivery</span>
              <strong>
                {quote ? formatPrice(quote.shippingTotalMinor / 100, quote.currency) : requiresShipping ? "Enter address" : "Digital delivery"}
              </strong>
            </p>
            <p className="shop-checkout__grand-total">
              <span>Total</span>
              <strong>
                {quote ? formatPrice(quote.totalMinor / 100, quote.currency) : subtotalLabel}
              </strong>
            </p>
          </div>
          <p className="shop-checkout__currency-note">
            Currency is selected from your location: UK uses GBP, EU countries use EUR, and all other or unknown locations use USD.
          </p>
        </div>

        <div className="shop-checkout__message">
          <span className="handwritten">Guest checkout.</span>
          <h2>{requiresShipping ? "Delivery Details." : "Your Details."}</h2>
          <form className="shop-checkout__form" onSubmit={(event) => event.preventDefault()}>
            <label>
              First name
              <input autoComplete="given-name" required value={address.firstName} onChange={(event) => updateAddress("firstName", event.target.value)} />
            </label>
            <label>
              Last name
              <input autoComplete="family-name" required value={address.lastName} onChange={(event) => updateAddress("lastName", event.target.value)} />
            </label>
            <label>
              Email
              <input autoComplete="email" required type="email" value={address.email} onChange={(event) => updateAddress("email", event.target.value)} />
            </label>
            {requiresShipping ? <>
            <label>
              Phone
              <input autoComplete="tel" required type="tel" value={address.phone} onChange={(event) => updateAddress("phone", event.target.value)} />
            </label>
            <label className="is-wide">
              Address
              <input autoComplete="address-line1" required value={address.line1} onChange={(event) => updateAddress("line1", event.target.value)} />
            </label>
            <label className="is-wide">
              Address line 2 <small>Optional</small>
              <input autoComplete="address-line2" value={address.line2} onChange={(event) => updateAddress("line2", event.target.value)} />
            </label>
            <label>
              Town or city
              <input autoComplete="address-level2" required value={address.city} onChange={(event) => updateAddress("city", event.target.value)} />
            </label>
            <label>
              County / state <small>Optional</small>
              <input autoComplete="address-level1" value={address.region} onChange={(event) => updateAddress("region", event.target.value)} />
            </label>
            <label>
              Postcode / ZIP
              <input autoComplete="postal-code" required value={address.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} />
            </label>
            <label>
              Country
              <select autoComplete="country" required value={address.countryCode} onChange={(event) => updateAddress("countryCode", event.target.value)}>
                <option value="">Choose country</option>
                {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
              </select>
            </label>
            </> : null}
          </form>
          <label className="shop-checkout__order-message">
            Message to Luca <small>Optional</small>
            <textarea maxLength={2000} rows={4} value={orderMessage} onChange={(event) => setOrderMessage(event.target.value)} />
          </label>

          {quotePending ? <p className="shop-checkout__status">Calculating delivery…</p> : null}
          {message ? <p className="shop-checkout__error" role="alert">{message}</p> : null}

          <div className="shop-checkout__payments" aria-busy={paymentPending}>
            {quote?.totalMinor === 0 ? (
              <button className="action-link action-link--primary" disabled={!addressReady || quotePending || paymentPending} onClick={() => void completeFreeOrder()} type="button">Get free download</button>
            ) : config ? (
              <PayPalProvider
                clientId={config.clientId}
                components={["paypal-payments", "paypal-guest-payments"]}
                environment={config.environment}
                pageType="checkout"
              >
                <PayPalOneTimePaymentButton
                  createOrder={createOrder}
                  disabled={paymentDisabled}
                  onApprove={captureOrder}
                  onCancel={() => setPaymentPending(false)}
                  presentationMode="redirect"
                  onError={() => {
                    setPaymentPending(false);
                    setMessage((current) => current || "PayPal checkout could not be opened. Please try again.");
                  }}
                />
                <PayPalGuestPaymentButton
                  createOrder={createOrder}
                  disabled={paymentDisabled}
                  onApprove={captureOrder}
                  onCancel={() => setPaymentPending(false)}
                  onError={() => {
                    setPaymentPending(false);
                    setMessage((current) => current || "Card checkout could not be opened. Please try again.");
                  }}
                />
              </PayPalProvider>
            ) : (
              <p>Loading secure payment options…</p>
            )}
          </div>
          <p className="shop-checkout__secure-note">
            PayPal processes the payment. Card checkout appears when PayPal makes it available for the buyer.
          </p>
        </div>
      </div>
    </section>
  );
}
