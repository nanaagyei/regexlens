/**
 * Next.js instrumentation hook.
 *
 * Runs once per Node.js worker on startup. We use it to surface security
 * misconfigurations early (default dev credentials in production, missing
 * required secrets) so they are visible in deployment logs rather than
 * silently degrading at runtime.
 *
 * The check is deliberately non-fatal: we log loudly but do not throw, to
 * avoid taking down a deployment over a misconfiguration that is otherwise
 * recoverable.
 *
 * Sentry: dynamic imports match @sentry/nextjs manual setup — server vs edge
 * init runs only in the matching runtime. Startup warnings are also reported
 * to Sentry in production so deploy-time misconfiguration shows up in issues.
 */

import * as Sentry from "@sentry/nextjs";

function isDocumentedLocalDevDatabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
      return false;
    }
    if (parsed.username !== "regexlens" || parsed.password !== "regexlens_dev") {
      return false;
    }
    const host = parsed.hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  // Env-backed checks apply to the Node server only (full process env).
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const issues: string[] = [];

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (isDocumentedLocalDevDatabaseUrl(dbUrl)) {
    issues.push(
      "DATABASE_URL matches the documented local Docker credential pair " +
        "(regexlens / regexlens_dev on localhost). Production must use unique, strong credentials."
    );
  }

  if (!process.env.AUTH_SECRET) {
    issues.push("AUTH_SECRET is missing — sessions will not be signed correctly.");
  }

  if (!process.env.REDIS_URL) {
    issues.push(
      "REDIS_URL is missing — rate limiting and account lockout will fail closed."
    );
  }

  for (const issue of issues) {
    console.error(`[startup] SECURITY WARNING: ${issue}`);
  }

  if (issues.length > 0 && process.env.NODE_ENV === "production") {
    Sentry.captureMessage(`Startup security warnings (${issues.length})`, {
      level: "warning",
      tags: { source: "instrumentation", category: "startup_security" },
      extra: { issues },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
