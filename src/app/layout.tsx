import type { Metadata } from "next";
import {
  Bebas_Neue,
  Caveat,
  IBM_Plex_Sans_Condensed,
} from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteTextureToggle } from "@/components/SiteTextureToggle";
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
  metadataBase: new URL("https://lucapisanu.com"),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${handwrittenFont.variable}`}
    >
      <body>
        <SiteTextureToggle />
        <div id="top" />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
