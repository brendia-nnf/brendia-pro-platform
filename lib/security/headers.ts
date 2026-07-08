import { NextResponse } from "next/server";

/**
 * Security headers to add to all responses
 */
export const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS filter in older browsers
  "X-XSS-Protection": "1; mode=block",

  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://ipgtest.monri.com https://ipg.monri.com",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://ipgtest.monri.com https://ipg.monri.com",
    "frame-ancestors 'none'",
  ].join("; "),
};

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [header, value] of Object.entries(securityHeaders)) {
    response.headers.set(header, value);
  }
  return response;
}

/**
 * CORS configuration
 */
export const corsConfig = {
  // Allowed origins
  allowedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL || "https://app.brendiapro.hr",
    "https://brendiapro.hr",
    "https://www.brendiapro.hr",
  ],

  // Allowed methods
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-API-Key",
  ],

  // Expose headers
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],

  // Max age for preflight cache
  maxAge: 86400, // 24 hours
};

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  // Check if origin is allowed
  const isAllowedOrigin =
    !origin || corsConfig.allowedOrigins.includes(origin);

  if (isAllowedOrigin && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    corsConfig.allowedMethods.join(", ")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    corsConfig.allowedHeaders.join(", ")
  );
  response.headers.set(
    "Access-Control-Expose-Headers",
    corsConfig.exposedHeaders.join(", ")
  );
  response.headers.set(
    "Access-Control-Max-Age",
    corsConfig.maxAge.toString()
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

/**
 * Handle CORS preflight request
 */
export function handlePreflight(request: Request): NextResponse {
  const origin = request.headers.get("origin");
  const response = new NextResponse(null, { status: 204 });

  addCorsHeaders(response, origin);

  return response;
}
