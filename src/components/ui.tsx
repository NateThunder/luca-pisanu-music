import Link from "next/link";
import type { ReactNode } from "react";

type ActionLinkProps = {
  href: string | null;
  children: ReactNode;
  variant?: "primary" | "outline" | "text" | "dark";
  className?: string;
  ariaLabel?: string;
};

export function ActionLink({
  href,
  children,
  variant = "outline",
  className = "",
  ariaLabel,
}: ActionLinkProps) {
  const classes = `action-link action-link--${variant} ${className}`.trim();

  if (!href) {
    return (
      <span
        className={`${classes} is-disabled`}
        aria-disabled="true"
        title="Link coming soon"
      >
        {children}
      </span>
    );
  }

  const external = href.startsWith("http") || href.startsWith("mailto:");

  if (external) {
    return (
      <a
        className={classes}
        href={href}
        aria-label={ariaLabel}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function Arrow({ left = false }: { left?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={left ? "arrow arrow--left" : "arrow"}
      viewBox="0 0 24 12"
    >
      <path d="M1 6h20M16 1l5 5-5 5" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="m12 8 12 8-12 8V8Z" fill="currentColor" />
    </svg>
  );
}

export function Crosshair({ className = "" }: { className?: string }) {
  return (
    <span className={`crosshair ${className}`} aria-hidden="true">
      <span />
    </span>
  );
}

export function Barcode({ className = "" }: { className?: string }) {
  return <span className={`barcode ${className}`} aria-hidden="true" />;
}
