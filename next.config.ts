import type { NextConfig } from "next";

const docsBase = (
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.regexlens.dev"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Playwright (and some tooling) hits the dev server via 127.0.0.1 while the
  // browser may report a different host; without this, Next can block dev chunks/HMR
  // and client-only editors like Monaco never finish loading.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  /** Legacy /docs routes on this app → documentation subdomain (GitHub Pages). */
  async redirects() {
    return [
      {
        source: "/docs",
        destination: docsBase,
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: `${docsBase}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
