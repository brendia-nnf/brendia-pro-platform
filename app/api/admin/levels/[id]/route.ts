import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateLevelSchema = z.object({
  isPublished: z.boolean(),
});

// PATCH - Update level settings (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: levelId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateLevelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { isPublished } = validation.data;

    const adminClient = createAdminClient();
    const { data: updated, error: updateError } = await adminClient
      .from("levels")
      .update({ is_published: isPublished } as never)
      .eq("id", levelId)
      .select("id, is_published")
      .single() as {
        data: { id: string; is_published: boolean } | null;
        error: unknown;
      };

    if (updateError || !updated) {
      console.error("Update level error:", updateError);
      return NextResponse.json(
        { error: "Failed to update level" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      level: {
        id: updated.id,
        isPublished: updated.is_published,
      },
    });
  } catch (error) {
    console.error("Update level error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
