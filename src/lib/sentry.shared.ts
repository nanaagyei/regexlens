/**
 * Shared Sentry options for server, edge, and browser bundles.
 * Prefer NEXT_PUBLIC_SENTRY_DSN (or SENTRY_DSN on server) over committing a DSN;
 * a fallback remains so local/onboarding keeps working.
 */

const FALLBACK_DSN =
  "https://68b813c8a4a3dcd27d8a8e2ce09a1f93@o4511317888729088.ingest.us.sentry.io/4511317889908736";

export function getSentryDsn(): string | undefined {
  const dsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
    process.env.SENTRY_DSN?.trim() ||
    FALLBACK_DSN;
  return dsn || undefined;
}

export function getSentryEnvironment(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

/**
 * Production defaults to 0.2 to limit quota; dev uses 1 for full visibility.
 * Override with SENTRY_TRACES_SAMPLE_RATE (0–1).
 */
export function getTracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE?.trim();
  if (raw) {
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 1) {
      return n;
    }
  }
  return process.env.NODE_ENV === "production" ? 0.2 : 1;
}
