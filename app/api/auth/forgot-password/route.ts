import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getClientId, checkRateLimit, rateLimitConfigs } from "@/lib/security/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  // Rate limiting - stricter for password reset
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(clientId, {
    windowMs: 60 * 1000,
    maxRequests: 3,
    message: "Too many password reset attempts. Please try again later.",
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many password reset attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const supabase = createAdminClient();

    // Generate password reset link
    const { error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/hr/reset-password`,
      },
    });

    if (error) {
      // Don't reveal if email exists or not for security
      console.error("Password reset error:", error);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
