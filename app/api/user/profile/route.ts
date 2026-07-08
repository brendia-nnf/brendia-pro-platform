import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    interface ProfileRow {
      full_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      role: string;
      created_at: string;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single() as { data: ProfileRow | null; error: unknown };

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      createdAt: profile.created_at,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (validation.data.fullName !== undefined) {
      updates.full_name = validation.data.fullName;
    }
    if (validation.data.phone !== undefined) {
      updates.phone = validation.data.phone;
    }
    if (validation.data.avatarUrl !== undefined) {
      updates.avatar_url = validation.data.avatarUrl;
    }

    interface UpdatedProfileRow {
      full_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      role: string;
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updates as never)
      .eq("id", user.id)
      .select()
      .single() as { data: UpdatedProfileRow | null; error: unknown };

    if (updateError || !profile) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      role: profile.role,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
