import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch all course levels
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    interface LevelRow {
      id: string;
      level_number: number;
      title: string;
      title_en: string | null;
      description: string | null;
      description_en: string | null;
      required_package: string;
      required_level: number;
      chapters: Array<{
        id: string;
        chapter_number: number;
        title: string;
        title_en: string | null;
        description: string | null;
        description_en: string | null;
        video_duration: number;
        video_thumbnail_url: string | null;
        is_preview: boolean;
        sort_order: number;
      }> | null;
    }

    // Fetch all published levels with chapters
    const { data: levels, error: levelsError } = await supabase
      .from("levels")
      .select(
        `
        *,
        chapters (
          id,
          chapter_number,
          title,
          title_en,
          description,
          description_en,
          video_duration,
          video_thumbnail_url,
          is_preview,
          sort_order
        )
      `
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true }) as { data: LevelRow[] | null; error: unknown };

    if (levelsError || !levels) {
      console.error("Fetch levels error:", levelsError);
      return NextResponse.json(
        { error: "Failed to fetch levels" },
        { status: 500 }
      );
    }

    // If user is authenticated, fetch their enrollment and progress
    let enrollment = null;
    let userProgress: Record<string, { watchPercentage: number; completed: boolean }> = {};

    if (user) {
      interface EnrollmentRow {
        package: string;
        status: string;
      }

      // Fetch enrollment
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("purchased_at", { ascending: false })
        .limit(1)
        .single() as { data: EnrollmentRow | null };

      enrollment = enrollmentData;

      interface ProgressRow {
        chapter_id: string;
        watch_percentage: number;
        completed: boolean;
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from("progress")
        .select("chapter_id, watch_percentage, completed")
        .eq("user_id", user.id) as { data: ProgressRow[] | null };

      if (progressData) {
        userProgress = progressData.reduce(
          (acc, p) => {
            acc[p.chapter_id] = {
              watchPercentage: p.watch_percentage,
              completed: p.completed,
            };
            return acc;
          },
          {} as Record<string, { watchPercentage: number; completed: boolean }>
        );
      }
    }

    // Determine access for each level
    const formattedLevels = levels.map((level) => {
      // Level access rules:
      // - Level 1: Available to all enrolled users (basic or advanced package)
      // - Level 2: Available to all enrolled users
      // - Level 3: Available only to advanced package users
      let isLocked = true;
      let lockReason = "not_enrolled";

      if (enrollment) {
        if (level.level_number <= 2) {
          // Levels 1-2 available to any enrolled user
          isLocked = false;
        } else if (level.level_number === 3) {
          // Level 3 only for advanced package
          if (enrollment.package === "advanced") {
            isLocked = false;
          } else {
            lockReason = "requires_advanced";
          }
        }

        // Check if previous level is completed (sequential unlock)
        if (!isLocked && level.required_level > 0) {
          const previousLevel = levels.find(
            (l) => l.level_number === level.required_level
          );
          if (previousLevel) {
            const previousChapters = previousLevel.chapters || [];
            const completedCount = previousChapters.filter(
              (c: { id: string }) => userProgress[c.id]?.completed
            ).length;
            if (completedCount < previousChapters.length) {
              isLocked = true;
              lockReason = "complete_previous";
            }
          }
        }
      }

      const chapters = (level.chapters || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((chapter: {
          id: string;
          chapter_number: number;
          title: string;
          title_en: string | null;
          description: string | null;
          description_en: string | null;
          video_duration: number;
          video_thumbnail_url: string | null;
          is_preview: boolean;
        }) => {
          const progress = userProgress[chapter.id];
          let state: "locked" | "available" | "in_progress" | "completed" = "locked";

          if (!isLocked || chapter.is_preview) {
            if (progress?.completed) {
              state = "completed";
            } else if (progress && progress.watchPercentage > 0) {
              state = "in_progress";
            } else {
              state = "available";
            }
          }

          return {
            id: chapter.id,
            chapterNumber: chapter.chapter_number,
            title: chapter.title,
            titleEn: chapter.title_en,
            description: chapter.description,
            descriptionEn: chapter.description_en,
            videoDuration: chapter.video_duration,
            thumbnailUrl: chapter.video_thumbnail_url,
            isPreview: chapter.is_preview,
            state,
            watchPercentage: progress?.watchPercentage || 0,
          };
        });

      return {
        id: level.id,
        levelNumber: level.level_number,
        title: level.title,
        titleEn: level.title_en,
        description: level.description,
        descriptionEn: level.description_en,
        requiredPackage: level.required_package,
        isLocked,
        lockReason: isLocked ? lockReason : null,
        chapters,
        totalChapters: chapters.length,
        completedChapters: chapters.filter(
          (c: { state: string }) => c.state === "completed"
        ).length,
      };
    });

    return NextResponse.json({ levels: formattedLevels });
  } catch (error) {
    console.error("Get levels error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
