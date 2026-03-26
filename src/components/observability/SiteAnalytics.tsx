"use client";

import { Analytics } from "@vercel/analytics/react";

const disabled = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "0";

export function SiteAnalytics() {
  if (disabled) return null;
  return <Analytics />;
}
