import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Get client identifier for rate limiting
 */
export function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  // Use first IP from forwarded header or fall back to real-ip
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  // Include user-agent for additional uniqueness
  const userAgent = request.headers.get("user-agent") || "";

  // Hash the combination for privacy
  return `${ip}:${hashString(userAgent)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check rate limit for a client
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  // If no record or window expired, create new
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const clientId = getClientId(request);
    const result = checkRateLimit(clientId, config);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: config.message || "Too many requests. Please try again later.",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetTime.toString(),
          },
        }
      );
    }

    const response = await handler(request);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

    return response;
  };
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: "Too many authentication attempts. Please wait a minute.",
  },

  // Contact form - moderate limits
  contact: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
    message: "Too many messages. Please wait a minute before sending another.",
  },

  // General API - relaxed limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: "Too many requests. Please slow down.",
  },

  // Progress updates - moderate limits
  progress: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: "Too many progress updates. Please wait.",
  },
};
