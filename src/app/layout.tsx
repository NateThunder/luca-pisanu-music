import type { Metadata } from "next";
import {
  Bebas_Neue,
  Caveat,
  IBM_Plex_Sans_Condensed,
} from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteTextureToggle } from "@/components/SiteTextureToggle";
import { ShopCartProvider } from "@/components/shop/ShopCartContext";
import { FloatingCartButton } from "@/components/shop/FloatingCartButton";
import { getShopProducts } from "@/lib/shop-data";
import { getMusicReleases } from "@/lib/music-data";
import { currencyForCountry } from "@/lib/shop-orders";
import { headers } from "next/headers";
import "./globals.css";

const displayFont = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = IBM_Plex_Sans_Condensed({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const handwrittenFont = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lucapisanumusic.com"),
  manifest: "/favicon/site.webmanifest",
  title: {
    default: "Luca Pisanu | Independent Artist",
    template: "%s | Luca Pisanu",
  },
  description:
    "Luca Pisanu is a singer-songwriter, composer, producer, multi-instrumentalist and independent artist.",
  openGraph: {
    title: "Luca Pisanu | Independent Artist",
    description:
      "Songs, sound, performance and guitar lessons from Luca Pisanu.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [shopProducts, musicReleases, requestHeaders] = await Promise.all([
    getShopProducts({ includeMusicReleases: true }), getMusicReleases(), headers(),
  ]);
  const releasesByProductId = new Map(musicReleases.filter((release) => release.purchaseProductId).map((release) => [release.purchaseProductId!, release]));
  const products = shopProducts.map((product) => {
    const release = releasesByProductId.get(product.id);
    return release ? { ...product, frontArtworkUrl: release.coverArtUrl, artworkAlt: release.coverArtAlt || release.title } : product;
  });
  const currency = currencyForCountry(requestHeaders.get("cf-ipcountry"));
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${handwrittenFont.variable}`}
    >
      <body>
        <ShopCartProvider products={products} currency={currency}>
          <SiteTextureToggle />
          <div id="top" />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <FloatingCartButton />
        </ShopCartProvider>
      </body>
    </html>
  );
}
