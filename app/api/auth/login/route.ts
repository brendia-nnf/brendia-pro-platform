import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const supabase = createAdminClient();

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "Login failed" },
        { status: 401 }
      );
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    // Fetch active enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .order("purchased_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || "",
        phone: profile?.phone,
        role: profile?.role || "user",
        avatarUrl: profile?.avatar_url,
        purchasePackage: enrollment?.package || null,
        subscriptionStatus: enrollment?.status || null,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
