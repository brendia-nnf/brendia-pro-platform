import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getClientId, checkRateLimit, rateLimitConfigs } from "@/lib/security/rate-limit";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(clientId, rateLimitConfigs.auth);

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
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    const supabase = await createServerSupabaseClient();

    // Get current session (user should be authenticated via the reset link)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 401 }
      );
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
