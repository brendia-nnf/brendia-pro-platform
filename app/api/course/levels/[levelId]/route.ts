import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestLocale, localized } from "@/lib/i18n/api-locale";

// GET - Fetch single level with chapters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ levelId: string }> }
) {
  try {
    const { levelId } = await params;
    const locale = getRequestLocale(request);
    const supabase = await createServerSupabaseClient();

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
        is_published: boolean;
        requires_photos: boolean;
        sort_order: number;
      }> | null;
    }

    // Fetch level with chapters
    const { data: level, error: levelError } = await supabase
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
          is_published,
          requires_photos,
          sort_order
        )
      `
      )
      .eq("id", levelId)
      .eq("is_published", true)
      .single() as { data: LevelRow | null; error: unknown };

    // Students only see published chapters
    if (level) {
      level.chapters = (level.chapters || []).filter((c) => c.is_published);
    }

    if (levelError || !level) {
      return NextResponse.json(
        { error: "Level not found" },
        { status: 404 }
      );
    }

    // Check user's enrollment and access
    let hasAccess = false;
    let enrollment = null;
    let userProgress: Record<string, { watchPercentage: number; completed: boolean; lastPosition: number }> = {};
    const photoStatuses: Record<string, string> = {};

    if (user) {
      interface EnrollmentRow {
        package: string;
        status: string;
      }

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("purchased_at", { ascending: false })
        .limit(1)
        .single() as { data: EnrollmentRow | null };

      enrollment = enrollmentData;

      if (enrollment) {
        if (level.required_package !== "advanced") {
          hasAccess = true;
        } else if (enrollment.package === "advanced") {
          hasAccess = true;
        }
      }

      interface ProgressRow {
        chapter_id: string;
        watch_percentage: number;
        completed: boolean;
        last_position: number;
      }

      // Fetch progress for this level's chapters
      const chapterIds = level.chapters?.map((c) => c.id) || [];
      if (chapterIds.length > 0) {
        const { data: progressData } = await supabase
          .from("progress")
          .select("chapter_id, watch_percentage, completed, last_position")
          .eq("user_id", user.id)
          .in("chapter_id", chapterIds) as { data: ProgressRow[] | null };

        if (progressData) {
          userProgress = progressData.reduce(
            (acc, p) => {
              acc[p.chapter_id] = {
                watchPercentage: p.watch_percentage,
                completed: p.completed,
                lastPosition: p.last_position,
              };
              return acc;
            },
            {} as Record<string, { watchPercentage: number; completed: boolean; lastPosition: number }>
          );
        }

        interface SubmissionStatusRow {
          chapter_id: string;
          attempt_number: number;
          status: string;
        }

        // Latest photo submission status per chapter
        const { data: submissionData } = await supabase
          .from("photo_submissions")
          .select("chapter_id, attempt_number, status")
          .eq("user_id", user.id)
          .in("chapter_id", chapterIds)
          .order("attempt_number", { ascending: false }) as {
            data: SubmissionStatusRow[] | null;
          };

        for (const s of submissionData || []) {
          if (!photoStatuses[s.chapter_id]) {
            photoStatuses[s.chapter_id] = s.status;
          }
        }
      }
    }

    // Sequential unlock within the level: a chapter is locked until the
    // previous one is watched and, if it requires photos, has a submission.
    let previousSatisfied = true;

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
        requires_photos: boolean;
      }) => {
        const progress = userProgress[chapter.id];
        const photoStatus = photoStatuses[chapter.id] || null;
        let state:
          | "locked"
          | "available"
          | "in_progress"
          | "awaiting_photos"
          | "photos_in_review"
          | "redo_requested"
          | "completed" = "locked";

        if ((hasAccess && previousSatisfied) || chapter.is_preview) {
          if (progress?.completed) {
            if (chapter.requires_photos) {
              if (!photoStatus) {
                state = "awaiting_photos";
              } else if (photoStatus === "pending") {
                state = "photos_in_review";
              } else if (photoStatus === "redo_requested") {
                state = "redo_requested";
              } else {
                state = "completed";
              }
            } else {
              state = "completed";
            }
          } else if (progress && progress.watchPercentage > 0) {
            state = "in_progress";
          } else {
            state = "available";
          }
        }

        // The next chapter unlocks once this one is watched and, when
        // photos are required, at least submitted (approval not needed)
        previousSatisfied =
          !!progress?.completed &&
          (!chapter.requires_photos || photoStatus !== null);

        return {
          id: chapter.id,
          chapterNumber: chapter.chapter_number,
          title: localized(locale, chapter.title, chapter.title_en),
          titleEn: chapter.title_en,
          description: localized(locale, chapter.description, chapter.description_en),
          descriptionEn: chapter.description_en,
          videoDuration: chapter.video_duration,
          thumbnailUrl: chapter.video_thumbnail_url,
          isPreview: chapter.is_preview,
          requiresPhotos: chapter.requires_photos,
          photoStatus,
          state,
          watchPercentage: progress?.watchPercentage || 0,
          lastPosition: progress?.lastPosition || 0,
        };
      });

    return NextResponse.json({
      id: level.id,
      levelNumber: level.level_number,
      title: localized(locale, level.title, level.title_en),
      titleEn: level.title_en,
      description: localized(locale, level.description, level.description_en),
      descriptionEn: level.description_en,
      requiredPackage: level.required_package,
      hasAccess,
      chapters,
      totalChapters: chapters.length,
      completedChapters: chapters.filter((c: { state: string }) => c.state === "completed").length,
    });
  } catch (error) {
    console.error("Get level error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
