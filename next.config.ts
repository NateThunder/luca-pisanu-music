import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.lucapisanumusic.com" }],
        destination: "https://lucapisanumusic.com",
        permanent: true,
      },
      {
        source: "/:path+",
        has: [{ type: "host", value: "www.lucapisanumusic.com" }],
        destination: "https://lucapisanumusic.com/:path+",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/admin/reset",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
