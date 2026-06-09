import type { ReactNode } from "react";
import { Barcode, Crosshair } from "./ui";

export function PageHero({
  eyebrow,
  title,
  accent,
  copy,
  actions,
  visual,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  accent?: string;
  copy: string;
  actions?: ReactNode;
  visual: ReactNode;
  className?: string;
}) {
  return (
    <section className={`page-hero ${className}`}>
      <div className="page-hero__content">
        <div className="section-kicker">
          <span>{eyebrow}</span>
        </div>
        <h1>{title}</h1>
        {accent && <p className="handwritten">{accent}</p>}
        <p className="page-hero__copy">{copy}</p>
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
      <div className="page-hero__visual">{visual}</div>
      <Crosshair className="page-hero__crosshair" />
      <Barcode className="page-hero__barcode" />
    </section>
  );
}
