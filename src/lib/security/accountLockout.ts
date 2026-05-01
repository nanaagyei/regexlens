import { getRedisClient } from "@/lib/security/redisClient";
import { hashEmail, logAuditEvent } from "@/lib/security/auditLog";

/**
 * Per-account lockout (account enumeration / brute-force defense).
 *
 * Currently used for magic-link sends via the Resend provider. Limits how
 * many verification emails can be issued for a given email address within a
 * fixed time window, irrespective of which IP triggered them. Distributed
 * brute-force from many IPs targeted at one account is the threat model.
 *
 * Design:
 * - Redis-backed counter, atomic via `MULTI INCR + EXPIRE NX` (no TOCTOU).
 * - Email is SHA-256 hashed before use as a Redis key — no plaintext PII.
 * - Production fail-closed when Redis is unreachable (consistent with rate
 *   limiter for security-critical paths).
 * - Non-production allows attempts when Redis is missing, with a warning, so
 *   local dev does not require a Redis instance.
 */

export interface MagicLinkAttemptResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const MAGIC_LINK_WINDOW_SECONDS = 60 * 60; // 1 hour
const MAGIC_LINK_MAX_ATTEMPTS = 10;

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

let warnedAboutMissingRedis = false;

function buildKey(emailHash: string, windowStartSeconds: number): string {
  return `auth:lockout:magic_link:${emailHash}:${windowStartSeconds}`;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function denied(retryAfterSeconds: number): MagicLinkAttemptResult {
  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds,
  };
}

/**
 * Record a magic-link send attempt for the given email and report whether
 * the send is allowed under the lockout policy.
 *
 * On lockout (`allowed === false`) the caller MUST drop the send silently —
 * never reveal to the requester whether the email exists or is throttled,
 * to avoid enumeration. An audit event is emitted automatically.
 */
export async function recordMagicLinkAttempt(
  email: string
): Promise<MagicLinkAttemptResult> {
  const emailHash = hashEmail(email);
  const windowStart =
    Math.floor(nowSeconds() / MAGIC_LINK_WINDOW_SECONDS) *
    MAGIC_LINK_WINDOW_SECONDS;
  const windowEnd = windowStart + MAGIC_LINK_WINDOW_SECONDS;
  const key = buildKey(emailHash, windowStart);

  let redis: Awaited<ReturnType<typeof getRedisClient>> = null;
  try {
    redis = await getRedisClient();
  } catch (error) {
    console.error("Account lockout: redis connect failed", error);
  }

  if (!redis) {
    const production = isProductionEnv();
    if (!warnedAboutMissingRedis) {
      warnedAboutMissingRedis = true;
      console.warn(
        `Account lockout: REDIS_URL not configured (production=${production}). ` +
          (production
            ? "Magic-link sends fail closed."
            : "Allowing all attempts in non-production.")
      );
    }
    if (production) {
      logAuditEvent({
        event: "auth.lockout_triggered",
        emailHash,
        metadata: { reason: "redis_unavailable", policy: "fail_closed" },
      });
      return denied(MAGIC_LINK_WINDOW_SECONDS);
    }
    return {
      allowed: true,
      remaining: MAGIC_LINK_MAX_ATTEMPTS - 1,
      retryAfterSeconds: 0,
    };
  }

  let current: number;
  try {
    const results = await redis
      .multi()
      .incr(key)
      .expire(key, MAGIC_LINK_WINDOW_SECONDS, "NX")
      .exec();
    current = (results?.[0] as unknown as number) ?? 1;
  } catch (error) {
    console.error("Account lockout: redis op failed", error);
    if (isProductionEnv()) {
      logAuditEvent({
        event: "auth.lockout_triggered",
        emailHash,
        metadata: { reason: "redis_error", policy: "fail_closed" },
      });
      return denied(MAGIC_LINK_WINDOW_SECONDS);
    }
    return {
      allowed: true,
      remaining: MAGIC_LINK_MAX_ATTEMPTS - 1,
      retryAfterSeconds: 0,
    };
  }

  const remaining = Math.max(0, MAGIC_LINK_MAX_ATTEMPTS - current);
  const retryAfterSeconds = Math.max(0, windowEnd - nowSeconds());

  if (current > MAGIC_LINK_MAX_ATTEMPTS) {
    logAuditEvent({
      event: "auth.lockout_triggered",
      emailHash,
      metadata: {
        reason: "magic_link_rate",
        attempts: current,
        max: MAGIC_LINK_MAX_ATTEMPTS,
        retry_after_seconds: retryAfterSeconds,
      },
    });
    return denied(retryAfterSeconds);
  }

  return { allowed: true, remaining, retryAfterSeconds: 0 };
}

/**
 * Test-only export of constants for assertion stability.
 */
export const __magicLinkLockoutPolicy = {
  windowSeconds: MAGIC_LINK_WINDOW_SECONDS,
  maxAttempts: MAGIC_LINK_MAX_ATTEMPTS,
} as const;
