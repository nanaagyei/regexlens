"use client";

import Script from "next/script";

/**
 * Loads Google AdSense only when explicitly enabled.
 * Before enabling in production, add a consent/CMP flow appropriate for your regions.
 */
export function OptionalAdScript() {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "1";
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  if (!enabled || !client) return null;

  return (
    <Script
      id="adsense-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
