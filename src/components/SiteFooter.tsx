import Link from "next/link";
import { contactEmail, navigation, socialLinks } from "@/data/site";
import { ActionLink, Arrow } from "./ui";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__primary">
        <Link className="wordmark wordmark--footer" href="/">
          <span>Luca</span>
          <span>Pisanu</span>
        </Link>
        <nav aria-label="Footer navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <a className="back-to-top" href="#top" aria-label="Back to top">
          <Arrow left />
        </a>
      </div>
      <div className="site-footer__secondary">
        <p>
          © {new Date().getFullYear()} Luca Pisanu. Independent artist,
          musician & educator.
        </p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        <div className="footer-socials" aria-label="Social links">
          {socialLinks.map((link) => (
            <ActionLink href={link.href} variant="text" key={link.label}>
              {link.label}
            </ActionLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
