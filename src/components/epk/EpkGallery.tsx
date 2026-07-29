"use client";

import { useEffect, useRef, useState } from "react";
import type { EpkGalleryItem } from "@/lib/epk-data";

export function EpkGallery({ items }: { items: EpkGalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".epk-reveal"));
    let frame = 0;
    const revealVisible = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        elements.forEach((element) => {
          if (element.classList.contains("is-visible")) return;
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight * 1.04 && rect.bottom > 0) {
            element.classList.add("is-visible");
          }
        });
      });
    };
    revealVisible();
    window.addEventListener("scroll", revealVisible, { passive: true });
    window.addEventListener("resize", revealVisible);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", revealVisible);
      window.removeEventListener("resize", revealVisible);
    };
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") setActiveIndex((value) => value === null ? null : (value + 1) % items.length);
      if (event.key === "ArrowLeft") setActiveIndex((value) => value === null ? null : (value - 1 + items.length) % items.length);
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".epk-lightbox__dialog");
        const focusable = dialog?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      openerRef.current?.focus();
    };
  }, [activeIndex, items.length]);

  const active = activeIndex === null ? null : items[activeIndex];
  const activePosition = activeIndex ?? 0;

  return (
    <>
      {items.length ? (
        <div className="epk-gallery__grid">
          {items.map((item, index) => (
            <article className="epk-gallery__item epk-reveal" key={item.id}>
              <button
                className="epk-gallery__preview"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setActiveIndex(index);
                }}
                type="button"
                aria-label={`View ${item.title}`}
              >
                {/* R2 images retain their original dimensions and are responsively cropped here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={item.title} src={item.previewUrl} />
                <span>View full size</span>
              </button>
              <div className="epk-gallery__meta">
                <div>
                  <h3>{item.title}</h3>
                  <p>Photo: {item.credit}</p>
                </div>
                <a className="epk-download epk-download--small" download href={item.downloadUrl}>
                  Download original <span aria-hidden="true">↓</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="epk-gallery__empty epk-reveal">
          <span>Approved selection in progress</span>
          <p>High-resolution press photography will appear here. For an immediate request, use the booking contact below.</p>
        </div>
      )}

      {active ? (
        <div
          className="epk-lightbox"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setActiveIndex(null);
          }}
        >
          <section
            aria-label={`${active.title} image preview`}
            aria-modal="true"
            className="epk-lightbox__dialog"
            role="dialog"
          >
            <button
              aria-label="Close image preview"
              className="epk-lightbox__close"
              onClick={() => setActiveIndex(null)}
              ref={closeRef}
              type="button"
            >
              Close <span aria-hidden="true">×</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={active.title} src={active.previewUrl} />
            <footer>
              <div>
                <strong>{active.title}</strong>
                <span>Photo: {active.credit}</span>
              </div>
              <a className="epk-download" download href={active.downloadUrl}>
                Download original <span aria-hidden="true">↓</span>
              </a>
            </footer>
            {items.length > 1 ? (
              <div className="epk-lightbox__paging">
                <button onClick={() => setActiveIndex((activePosition - 1 + items.length) % items.length)} type="button">Previous</button>
                <span>{activePosition + 1} / {items.length}</span>
                <button onClick={() => setActiveIndex((activePosition + 1) % items.length)} type="button">Next</button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
