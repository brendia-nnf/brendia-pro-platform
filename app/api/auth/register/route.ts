import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getClientId, checkRateLimit, rateLimitConfigs } from "@/lib/security/rate-limit";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientId(request);
  const rateLimit = checkRateLimit(clientId, rateLimitConfigs.auth);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
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
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, fullName, phone } = validation.data;

    const supabase = createAdminClient();

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Will send confirmation email
      user_metadata: {
        full_name: fullName,
        phone,
      },
    });

    if (error) {
      // Check for duplicate email
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    // Update profile with phone if provided
    if (phone) {
      await supabase
        .from("profiles")
        .update({ phone, full_name: fullName } as never)
        .eq("id", data.user.id);
    }

    // Send verification email
    // Note: User was created with email_confirm: false, so Supabase will handle verification
    // We use invite type here to send the verification link
    await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/hr/prijava?verified=true`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
      userId: data.user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
