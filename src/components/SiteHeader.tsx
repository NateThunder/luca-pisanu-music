"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation, socialLinks } from "@/data/site";

const headerSocialLabels = ["Spotify", "Apple Music", "YouTube", "Instagram"];

function SocialIcon({ label }: { label: string }) {
  switch (label) {
    case "Spotify":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm4.47 14.08a.7.7 0 0 1-.96.23c-2.63-1.6-5.94-1.96-9.84-1.07a.7.7 0 0 1-.31-1.37c4.27-.98 7.94-.56 10.88 1.24.33.2.43.63.23.97Zm1.2-2.66a.87.87 0 0 1-1.2.29c-3-1.84-7.57-2.37-11.12-1.3a.88.88 0 0 1-.51-1.68c4.06-1.23 9.1-.64 12.54 1.46.42.26.55.81.29 1.23Zm.1-2.78C14.17 8.75 8.24 8.55 4.8 9.6a1.04 1.04 0 1 1-.61-1.99c3.95-1.2 10.49-.97 14.65 1.5a1.04 1.04 0 0 1-1.06 1.78Z"
            fill="currentColor"
          />
        </svg>
      );
    case "Apple Music":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M16.47 12.47c-.02-2.18 1.78-3.23 1.86-3.28-1.02-1.49-2.6-1.7-3.16-1.72-1.35-.14-2.63.79-3.31.79-.68 0-1.73-.77-2.85-.75-1.46.02-2.8.85-3.56 2.16-1.52 2.64-.39 6.54 1.1 8.68.72 1.05 1.59 2.24 2.73 2.19 1.09-.04 1.5-.71 2.82-.71 1.31 0 1.68.71 2.83.69 1.17-.02 1.91-1.07 2.63-2.13.83-1.21 1.17-2.39 1.19-2.45-.03-.01-2.26-.87-2.28-3.47ZM14.29 6.05c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.91 2.68.96.08 1.94-.49 2.55-1.23Z"
            fill="currentColor"
          />
        </svg>
      );
    case "YouTube":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M21.55 7.2a2.48 2.48 0 0 0-1.74-1.75C18.28 5.04 12 5.04 12 5.04s-6.28 0-7.81.41A2.48 2.48 0 0 0 2.45 7.2 25.8 25.8 0 0 0 2.04 12c0 1.68.13 3.32.41 4.8a2.48 2.48 0 0 0 1.74 1.75c1.53.41 7.81.41 7.81.41s6.28 0 7.81-.41a2.48 2.48 0 0 0 1.74-1.75c.28-1.48.41-3.12.41-4.8 0-1.68-.13-3.32-.41-4.8ZM10 14.95v-5.9L15.2 12 10 14.95Z"
            fill="currentColor"
          />
        </svg>
      );
    case "Instagram":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M7.8 2.75h8.4a5.05 5.05 0 0 1 5.05 5.05v8.4a5.05 5.05 0 0 1-5.05 5.05H7.8a5.05 5.05 0 0 1-5.05-5.05V7.8A5.05 5.05 0 0 1 7.8 2.75Zm0 1.8A3.25 3.25 0 0 0 4.55 7.8v8.4a3.25 3.25 0 0 0 3.25 3.25h8.4a3.25 3.25 0 0 0 3.25-3.25V7.8a3.25 3.25 0 0 0-3.25-3.25H7.8Zm4.2 3.1a4.35 4.35 0 1 1 0 8.7 4.35 4.35 0 0 1 0-8.7Zm0 1.8a2.55 2.55 0 1 0 0 5.1 2.55 2.55 0 0 0 0-5.1Zm4.56-2.61a1.02 1.02 0 1 1 0 2.04 1.02 1.02 0 0 1 0-2.04Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const headerSocials = headerSocialLabels
    .map((label) => socialLinks.find((link) => link.label === label))
    .filter((link): link is (typeof socialLinks)[number] => Boolean(link));

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 110);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const renderLogo = () => (
    <Image
      src="/luca-pisanu-logo-nav-white.png"
      alt="Luca Pisanu"
      width={1893}
      height={559}
      className="wordmark__image"
      priority
    />
  );

  return (
    <>
      <header className={`site-header ${compact ? "is-compact" : ""}`}>
        <div className="site-header__inner">
          <Link
            className="wordmark wordmark--logo"
            href="/"
            aria-label="Luca Pisanu home"
          >
            {renderLogo()}
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "is-active" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="header-socials" aria-label="Social links">
            {headerSocials.map((link) => {
              const label = link.ariaLabel ?? link.label;
              const icon = <SocialIcon label={link.label} />;

              if (!link.href) {
                return (
                  <span
                    key={link.label}
                    className="header-socials__item is-disabled"
                    aria-label={`${label} link coming soon`}
                    title={`${label} link coming soon`}
                  >
                    {icon}
                  </span>
                );
              }

              return (
                <a
                  key={link.label}
                  className="header-socials__item"
                  href={link.href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                >
                  {icon}
                </a>
              );
            })}
          </div>

          <button
            className="menu-trigger"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(true)}
          >
            Menu <span aria-hidden="true">＋</span>
          </button>
        </div>
      </header>

      <div
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        id="mobile-navigation"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu__top">
          <Link
            className="wordmark wordmark--logo"
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="Luca Pisanu home"
          >
            {renderLogo()}
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={menuOpen ? 0 : -1}
              className={pathname === item.href ? "is-active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <p>Songwriter · Composer · Producer · Multi-Instrumentalist</p>
      </div>
    </>
  );
}
