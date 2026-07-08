// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Fetch active enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("purchased_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch progress
    const { data: progress } = await supabase.rpc("get_user_progress", {
      p_user_id: user.id,
    });

    // Determine current level
    let currentLevel = 1;
    if (progress && progress.length > 0) {
      for (const p of progress) {
        if (p.progress_percentage > 0 && p.level_number > currentLevel) {
          currentLevel = p.level_number;
        }
      }
    }

    // Fetch certification status
    const { data: certification } = await supabase
      .from("certifications")
      .select("status")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || "",
        phone: profile?.phone,
        role: profile?.role || "user",
        avatarUrl: profile?.avatar_url,
        createdAt: user.created_at,
        lastLoginAt: user.last_sign_in_at,
      },
      enrollment: enrollment
        ? {
            courseId: enrollment.course_id,
            package: enrollment.package,
            status: enrollment.status,
            purchasedAt: enrollment.purchased_at,
            expiresAt: enrollment.expires_at,
          }
        : null,
      progress: progress || [],
      currentLevel,
      certificationStatus: certification?.status || "not_eligible",
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
