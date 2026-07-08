import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * API authentication middleware for mobile app and external API access
 */

interface AuthResult {
  authenticated: boolean;
  userId?: string;
  role?: "user" | "admin";
  error?: string;
}

/**
 * Verify API key (for mobile app or external integrations)
 */
export async function verifyApiKey(
  request: NextRequest
): Promise<AuthResult> {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return { authenticated: false, error: "API key required" };
  }

  // Validate API key format (UUID v4)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(apiKey)) {
    return { authenticated: false, error: "Invalid API key format" };
  }

  // In production, validate against database or environment
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!validApiKey || apiKey !== validApiKey) {
    return { authenticated: false, error: "Invalid API key" };
  }

  return { authenticated: true };
}

/**
 * Verify Bearer token (Supabase JWT)
 */
export async function verifyBearerToken(
  request: NextRequest
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false, error: "Authorization required" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false, error: "Invalid or expired token" };
    }

    // Get user role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      authenticated: true,
      userId: user.id,
      role: (profile?.role as "user" | "admin") || "user",
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return { authenticated: false, error: "Authentication failed" };
  }
}

/**
 * Require authentication middleware wrapper
 */
export function requireAuth(
  handler: (
    request: NextRequest,
    auth: { userId: string; role: "user" | "admin" }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await verifyBearerToken(request);

    if (!result.authenticated || !result.userId) {
      return NextResponse.json(
        { error: result.error || "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(request, {
      userId: result.userId,
      role: result.role || "user",
    });
  };
}

/**
 * Require admin role middleware wrapper
 */
export function requireAdmin(
  handler: (
    request: NextRequest,
    auth: { userId: string; role: "admin" }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await verifyBearerToken(request);

    if (!result.authenticated || !result.userId) {
      return NextResponse.json(
        { error: result.error || "Unauthorized" },
        { status: 401 }
      );
    }

    if (result.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return handler(request, { userId: result.userId, role: "admin" });
  };
}

/**
 * Verify API key or Bearer token (for mobile app)
 * Accepts either authentication method
 */
export async function verifyMobileAuth(
  request: NextRequest
): Promise<AuthResult> {
  // Try API key first
  const apiKeyResult = await verifyApiKey(request);
  if (apiKeyResult.authenticated) {
    return apiKeyResult;
  }

  // Fall back to Bearer token
  const tokenResult = await verifyBearerToken(request);
  return tokenResult;
}
