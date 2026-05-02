import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const docsBase = (
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.regexlens.dev"
).replace(/\/$/, "");

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP: never send `upgrade-insecure-requests` during local HTTP dev — browsers will
 * try https://localhost for RSC/flight fetches and fail with "Failed to fetch".
 * Same for HSTS on localhost (avoid pinning http→https expectations in dev).
 */
function buildContentSecurityPolicy(): string {
  const parts = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://va.vercel-scripts.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://images.unsplash.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.google-analytics.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (isProd) {
    parts.push("upgrade-insecure-requests");
  }
  return parts.join("; ");
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isProd
    ? ([
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ] as const)
    : []),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...securityHeaders],
      },
    ];
  },

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

export default withSentryConfig(nextConfig, {
  org: "nana-lv",

  project: "javascript-nextjs",

  silent: !process.env.CI,

  widenClientFileUpload: true,

  webpack: {
    automaticVercelMonitors: true,

    treeshake: {
      removeDebugLogging: true,
    },
  },
});
