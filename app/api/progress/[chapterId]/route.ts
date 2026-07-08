import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const progressUpdateSchema = z.object({
  watchPercentage: z.number().min(0).max(100),
  lastPosition: z.number().min(0),
  watchTime: z.number().min(0).optional(),
});

// POST - Update progress for a chapter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
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
    const validation = progressUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { watchPercentage, lastPosition, watchTime } = validation.data;

    interface ChapterRow {
      id: string;
      level: {
        level_number: number;
        required_package: string;
      } | null;
    }

    // Verify chapter exists and user has access
    const { data: chapter } = await supabase
      .from("chapters")
      .select(
        `
        id,
        level:levels (
          level_number,
          required_package
        )
      `
      )
      .eq("id", chapterId)
      .single() as { data: ChapterRow | null };

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    interface EnrollmentRow {
      package: string;
      status: string;
    }

    // Check enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("package, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single() as { data: EnrollmentRow | null };

    if (!enrollment) {
      return NextResponse.json(
        { error: "No active enrollment" },
        { status: 403 }
      );
    }

    // Check level access
    const levelNum = chapter.level?.level_number || 1;
    if (levelNum === 3 && enrollment.package !== "advanced") {
      return NextResponse.json(
        { error: "Access denied - requires advanced package" },
        { status: 403 }
      );
    }

    interface ProgressRow {
      watch_percentage: number;
      completed: boolean;
      last_position: number;
      watch_time: number;
    }

    // Upsert progress
    const { data: progress, error: upsertError } = await supabase
      .from("progress")
      .upsert(
        {
          user_id: user.id,
          chapter_id: chapterId,
          watch_percentage: watchPercentage,
          last_position: lastPosition,
          watch_time: watchTime || 0,
          updated_at: new Date().toISOString(),
        } as never,
        {
          onConflict: "user_id,chapter_id",
        }
      )
      .select()
      .single() as { data: ProgressRow | null; error: unknown };

    if (upsertError || !progress) {
      console.error("Progress upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to update progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      chapterId,
      watchPercentage: progress.watch_percentage,
      completed: progress.completed,
      lastPosition: progress.last_position,
      watchTime: progress.watch_time,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
