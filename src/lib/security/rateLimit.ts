import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/security/redisClient";
import { logAuditEvent } from "@/lib/security/auditLog";

/**
 * Rate limit configuration by endpoint type
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict to prevent brute force
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // General API endpoints
  api_free: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
  },
  // Export endpoint - more restrictive
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  // AI chat endpoint - moderate to control costs
  ai_chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface InMemoryCounter {
  count: number;
  resetAt: number;
}

const inMemoryCounters = new Map<string, InMemoryCounter>();
const FAIL_CLOSED_ON_REDIS_ERROR = new Set<RateLimitType>(["auth", "export", "ai_chat"]);
const isProduction = process.env.NODE_ENV === "production";

function shouldUseInMemoryFallback(): boolean {
  if (isProduction) return false;
  return process.env.RATE_LIMIT_ALLOW_FALLBACK_WITHOUT_REDIS !== "0";
}

function deniedRateLimitResult(
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  return {
    success: false,
    limit: maxRequests,
    remaining: 0,
    reset: Date.now() + windowMs,
  };
}

function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = inMemoryCounters.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    inMemoryCounters.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      reset: resetAt,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, maxRequests - existing.count);
  return {
    success: existing.count <= maxRequests,
    limit: maxRequests,
    remaining,
    reset: existing.resetAt,
  };
}

let warnedAboutMissingRedis = false;
let warnedAboutInMemoryFallback = false;

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  // Fallback - this shouldn't happen in production
  return "unknown";
}

/**
 * Generate rate limit key
 */
function getRateLimitKey(
  identifier: string,
  type: RateLimitType,
  windowMs: number
): string {
  const windowStart = Math.floor(Date.now() / windowMs);
  return `ratelimit:${type}:${identifier}:${windowStart}`;
}

/**
 * Check rate limit using sliding window algorithm
 * Returns whether the request should be allowed
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const key = getRateLimitKey(identifier, type, config.windowMs);

  try {
    const redis = await getRedisClient();

    if (!redis) {
      if (!warnedAboutMissingRedis) {
        warnedAboutMissingRedis = true;
        console.error(
          `REDIS_URL not configured for rate limiting (type=${type}, nodeEnv=${process.env.NODE_ENV ?? "unknown"})`,
        );
        logAuditEvent({
          event: "ratelimit.redis_unavailable",
          metadata: {
            cause: "redis_url_missing",
            production: isProduction,
            type,
          },
        });
      }

      if (isProduction) {
        return deniedRateLimitResult(config.maxRequests, config.windowMs);
      }

      if (shouldUseInMemoryFallback()) {
        if (!warnedAboutInMemoryFallback) {
          warnedAboutInMemoryFallback = true;
          console.warn("Using in-memory rate limit fallback (non-production only).");
        }
        return inMemoryRateLimit(key, config.maxRequests, config.windowMs);
      }

      return deniedRateLimitResult(config.maxRequests, config.windowMs);
    }

    const results = await redis
      .multi()
      .incr(key)
      .expire(key, Math.ceil(config.windowMs / 1000), "NX")
      .exec();

    const current = (results?.[0] as unknown as number) ?? 1;
    const remaining = Math.max(0, config.maxRequests - current);
    const reset = Date.now() + config.windowMs;

    return {
      success: current <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    logAuditEvent({
      event: "ratelimit.redis_unavailable",
      metadata: {
        cause: "redis_error",
        production: isProduction,
        type,
        error: error instanceof Error ? error.message : "unknown_error",
      },
    });

    if (isProduction && FAIL_CLOSED_ON_REDIS_ERROR.has(type)) {
      return deniedRateLimitResult(config.maxRequests, config.windowMs);
    }

    if (shouldUseInMemoryFallback()) {
      return inMemoryRateLimit(key, config.maxRequests, config.windowMs);
    }

    return deniedRateLimitResult(config.maxRequests, config.windowMs);
  }
}

/**
 * Build a 429 NextResponse and emit a rate-limit audit event in one place.
 */
function rateLimitedResponse(
  request: Request,
  type: RateLimitType,
  scope: "ip" | "user",
  identifier: string,
  result: RateLimitResult,
  message: string
): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  logAuditEvent({
    event: "ratelimit.exceeded",
    ip: scope === "ip" ? identifier : getClientIP(request),
    userId: scope === "user" ? identifier : undefined,
    path: new URL(request.url).pathname,
    metadata: {
      type,
      scope,
      limit: result.limit,
      retry_after_seconds: retryAfter,
    },
  });

  return NextResponse.json(
    {
      error: "rate_limited",
      message,
      retry_after: retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}

/**
 * Rate limit middleware for API routes
 * Returns a NextResponse if rate limited, null otherwise
 */
export async function rateLimit(
  request: Request,
  type: RateLimitType,
  userId?: string
): Promise<NextResponse | null> {
  const identifier = userId || getClientIP(request);
  const scope: "ip" | "user" = userId ? "user" : "ip";
  const result = await checkRateLimit(identifier, type);

  if (!result.success) {
    return rateLimitedResponse(
      request,
      type,
      scope,
      identifier,
      result,
      "Too many requests. Please try again later."
    );
  }

  return null;
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.reset));
  return response;
}

/**
 * Combined rate limit check for IP + User
 * More restrictive - both must pass
 */
export async function combinedRateLimit(
  request: Request,
  type: RateLimitType,
  userId?: string
): Promise<NextResponse | null> {
  const ip = getClientIP(request);

  // Always check IP-based limit
  const ipResult = await checkRateLimit(`ip:${ip}`, type);
  if (!ipResult.success) {
    return rateLimitedResponse(
      request,
      type,
      "ip",
      ip,
      ipResult,
      "Too many requests from this IP. Please try again later."
    );
  }

  // If user is authenticated, also check user-based limit
  if (userId) {
    const userResult = await checkRateLimit(`user:${userId}`, type);
    if (!userResult.success) {
      return rateLimitedResponse(
        request,
        type,
        "user",
        userId,
        userResult,
        "Too many requests. Please try again later."
      );
    }
  }

  return null;
}
