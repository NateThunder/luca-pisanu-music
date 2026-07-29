import Image from "next/image";
import Link from "next/link";
import { navigation, socialLinks } from "@/data/site";

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="16.8" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter() {
  const instagram = socialLinks.find((link) => link.label === "Instagram");
  const primaryNavigation = navigation.slice(0, 4);
  const secondaryNavigation = navigation.slice(4);

  return (
    <footer className="site-footer">
      <div className="site-footer__primary">
        <div className="site-footer__brand">
          <Link
            className="wordmark wordmark--logo wordmark--footer"
            href="/"
            aria-label="Luca Pisanu home"
          >
            <Image
              src="/luca-pisanu-logo-nav-white.png"
              alt="Luca Pisanu"
              width={1893}
              height={559}
              className="wordmark__image"
            />
          </Link>
          <a
            className="site-footer__credit"
            href="https://somevilabs.com/"
            target="_blank"
            rel="noreferrer"
          >
            Website by <strong>Somevi Labs</strong>
          </a>
        </div>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <h2>Navigate</h2>
          <div>
            <ul>
              {primaryNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
            <ul>
              {secondaryNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="site-footer__connect">
          <h2>Connect</h2>
          <a
            className="footer-instagram"
            href={instagram?.href ?? "https://www.instagram.com/lpisanu"}
            aria-label={instagram?.ariaLabel ?? "Luca Pisanu on Instagram"}
            target="_blank"
            rel="noreferrer"
          >
            <InstagramIcon />
            <span>@lpisanu</span>
          </a>
          <Link className="footer-booking" href="/contact?type=music">
            Book Luca
          </Link>
        </div>
      </div>

      <div className="site-footer__secondary">
        <p>
          &copy; {new Date().getFullYear()} Luca Pisanu. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
