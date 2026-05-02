const DEFAULT_CALLBACK = "/app";

/**
 * Returns a same-origin path safe to pass to NextAuth `signIn` / `callbackUrl`.
 * Rejects open redirects (`//`, `https:`, etc.) — aligned with `auth.ts` redirect callback.
 */
export function safeCallbackUrl(
  raw: string | null | undefined
): string {
  if (raw == null || raw === "") {
    return DEFAULT_CALLBACK;
  }

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep raw
  }

  const isSafeRelative =
    decoded.startsWith("/") &&
    !decoded.startsWith("//") &&
    !decoded.startsWith("/\\");

  return isSafeRelative ? decoded : DEFAULT_CALLBACK;
}
