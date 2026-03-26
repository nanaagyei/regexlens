"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";

const disabled = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "0";

export function SiteSpeedInsights() {
  if (disabled) return null;
  return <SpeedInsights />;
}
