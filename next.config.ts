import type { NextConfig } from "next";

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
};

export default nextConfig;
