import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

/**
 * Rate limit configuration by endpoint type
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict to prevent brute force
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // General API endpoints for free users
  api_free: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // General API endpoints for Pro users
  api_pro: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300,
  },
  // Webhook endpoints (Stripe)
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Export endpoint - more restrictive
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
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
    // Check if KV is configured with valid URLs
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const isValidKvConfig = kvUrl && kvToken && kvUrl.startsWith("https://");
    
    if (!isValidKvConfig) {
      // KV not configured - allow request but log warning in development
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Rate limiting disabled: KV_REST_API_URL or KV_REST_API_TOKEN not configured or invalid"
        );
      }
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Date.now() + config.windowMs,
      };
    }

    // Increment counter and get current value
    const current = await kv.incr(key);

    // Set expiry on first request in window
    if (current === 1) {
      await kv.expire(key, Math.ceil(config.windowMs / 1000));
    }

    const remaining = Math.max(0, config.maxRequests - current);
    const reset = Date.now() + config.windowMs;

    return {
      success: current <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
      reset,
    };
  } catch (error) {
    // If KV fails, allow the request but log the error
    console.error("Rate limit check failed:", error);
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowMs,
    };
  }
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
  // Use user ID if available, otherwise fall back to IP
  const identifier = userId || getClientIP(request);
  const result = await checkRateLimit(identifier, type);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many requests. Please try again later.",
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
    const retryAfter = Math.ceil((ipResult.reset - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many requests from this IP. Please try again later.",
        retry_after: retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(ipResult.limit),
          "X-RateLimit-Remaining": String(ipResult.remaining),
          "X-RateLimit-Reset": String(ipResult.reset),
        },
      }
    );
  }

  // If user is authenticated, also check user-based limit
  if (userId) {
    const userResult = await checkRateLimit(`user:${userId}`, type);
    if (!userResult.success) {
      const retryAfter = Math.ceil((userResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "Too many requests. Please try again later.",
          retry_after: retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(userResult.limit),
            "X-RateLimit-Remaining": String(userResult.remaining),
            "X-RateLimit-Reset": String(userResult.reset),
          },
        }
      );
    }
  }

  return null;
}
