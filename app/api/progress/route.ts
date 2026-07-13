import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch user's overall progress
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

    interface ProgressRow {
      level_number: number;
      total_chapters: number;
      completed_chapters: number;
      progress_percentage: number;
    }

    interface LastWatchedRow {
      chapter_id: string;
      chapter_title: string;
      level_number: number;
      last_position: number;
      watch_percentage: number;
    }

    // Get progress by level using the database function
    const { data: progress, error: progressError } = await supabase.rpc(
      "get_user_progress",
      { p_user_id: user.id } as never
    ) as { data: ProgressRow[] | null; error: unknown };

    if (progressError) {
      console.error("Progress fetch error:", progressError);
      return NextResponse.json(
        { error: "Failed to fetch progress" },
        { status: 500 }
      );
    }

    // Get last watched chapter
    const { data: lastWatched } = await supabase.rpc("get_last_watched", {
      p_user_id: user.id,
    } as never) as { data: LastWatchedRow[] | null };

    // Calculate overall progress (watch-based, weighted by chapter count)
    const totalChapters = progress?.reduce(
      (sum, p) => sum + Number(p.total_chapters),
      0
    ) || 0;
    const completedChapters = progress?.reduce(
      (sum, p) => sum + Number(p.completed_chapters),
      0
    ) || 0;
    const weightedProgress = progress?.reduce(
      (sum, p) => sum + Number(p.progress_percentage) * Number(p.total_chapters),
      0
    ) || 0;
    const overallPercentage =
      totalChapters > 0 ? Math.round(weightedProgress / totalChapters) : 0;

    return NextResponse.json({
      byLevel: progress?.map((p) => ({
        levelNumber: p.level_number,
        totalChapters: Number(p.total_chapters),
        completedChapters: Number(p.completed_chapters),
        progressPercentage: Number(p.progress_percentage),
      })) || [],
      overall: {
        totalChapters,
        completedChapters,
        progressPercentage: overallPercentage,
      },
      lastWatched: lastWatched?.[0]
        ? {
            chapterId: lastWatched[0].chapter_id,
            chapterTitle: lastWatched[0].chapter_title,
            levelNumber: lastWatched[0].level_number,
            lastPosition: lastWatched[0].last_position,
            watchPercentage: lastWatched[0].watch_percentage,
          }
        : null,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
