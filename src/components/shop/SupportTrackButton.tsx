"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CurrencyCode } from "@/data/site";
import { formatPrice } from "@/lib/shop";
import { useShopCart } from "./ShopCartContext";

export function SupportTrackButton({ productId, title, prices, compact = false }: {
  productId: string;
  title: string;
  prices: Record<CurrencyCode, number>;
  compact?: boolean;
}) {
  const { addSupportItem, currency } = useShopCart();
  const minimum = prices[currency];
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [amount, setAmount] = useState(minimum.toFixed(2));
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const numericAmount = Number(amount);
  const valid = Number.isFinite(numericAmount) && numericAmount >= minimum && numericAmount <= 100;

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function add() {
    if (!valid) return false;
    addSupportItem(productId, Math.round(numericAmount * 100));
    return true;
  }

  return <>
    <span className={`music-purchase${compact ? " music-purchase--compact" : ""}`}>
      <button className="action-link action-link--primary" onClick={(event) => { event.stopPropagation(); setAmount(minimum.toFixed(2)); setAdded(false); setOpen(true); }} type="button">
        Buy / Support
      </button>
    </span>
    {open ? createPortal(<div className="support-modal" role="presentation" onMouseDown={(event) => { event.stopPropagation(); setOpen(false); }}>
      <section aria-labelledby={titleId} aria-modal="true" className="support-modal__panel" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
        <button aria-label="Close" className="support-modal__close" onClick={() => setOpen(false)} type="button">×</button>
        {added ? <div className="support-modal__confirmation" role="status">
          <span className="micro-label">Added to cart</span>
          <h2 id={titleId}>{title}</h2>
          <p>Your chosen amount is {formatPrice(numericAmount, currency)}.</p>
          <div className="support-modal__actions">
            <Link className="action-link action-link--primary" href="/shop/cart">View cart</Link>
            <button className="action-link" onClick={() => setOpen(false)} type="button">Continue shopping</button>
          </div>
        </div> : <>
          <span className="micro-label">Digital track</span>
          <h2 id={titleId}>{title}</h2>
          <p className="support-modal__intro">Choose what you pay. The minimum for your location is {formatPrice(minimum, currency)}.</p>
          <label className="support-modal__amount">
            <span>Enter amount</span>
            <span className="support-modal__input"><b>{currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$"}</b><input ref={inputRef} inputMode="decimal" min={minimum} max="100" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /></span>
            <small>{formatPrice(minimum, currency)} or more · maximum {formatPrice(100, currency)}</small>
          </label>
          {!valid ? <p className="support-modal__error" role="alert">Enter an amount from {formatPrice(minimum, currency)} to {formatPrice(100, currency)}.</p> : null}
          <p className="support-modal__delivery">Includes the existing private MP3 and WAV download delivery after checkout.</p>
          <div className="support-modal__actions">
            <button className="action-link action-link--primary" disabled={!valid} onClick={() => { if (add()) window.location.assign("/shop/checkout"); }} type="button">Checkout now</button>
            <button className="action-link" disabled={!valid} onClick={() => { if (add()) setAdded(true); }} type="button">Add to cart</button>
          </div>
        </>}
      </section>
    </div>, document.body) : null}
  </>;
}
