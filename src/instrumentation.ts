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
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const issues: string[] = [];

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (/regexlens(?:_dev)?:regexlens_dev@/.test(dbUrl)) {
    issues.push(
      "DATABASE_URL appears to use default development credentials. " +
        "Production must use unique, strong credentials."
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
}
