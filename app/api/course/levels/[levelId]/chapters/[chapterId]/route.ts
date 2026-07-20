import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { generateSignedPlaybackUrl } from "@/lib/mux/client";
import { getRequestLocale, localized } from "@/lib/i18n/api-locale";

// GET - Fetch single chapter with video access
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ levelId: string; chapterId: string }> }
) {
  try {
    const { levelId, chapterId } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    interface ChapterRow {
      id: string;
      level_id: string;
      chapter_number: number;
      title: string;
      title_en: string | null;
      description: string | null;
      description_en: string | null;
      video_url: string | null;
      video_duration: number | null;
      video_thumbnail_url: string | null;
      is_preview: boolean;
      requires_photos: boolean;
      subtitle_hr: string | null;
      subtitle_en: string | null;
      level: {
        id: string;
        level_number: number;
        title: string;
        required_package: string;
      } | null;
    }

    // Fetch chapter with level info
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select(
        `
        *,
        level:levels (
          id,
          level_number,
          title,
          required_package
        )
      `
      )
      .eq("id", chapterId)
      .eq("level_id", levelId)
      .eq("is_published", true)
      .single() as { data: ChapterRow | null; error: unknown };

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Check access
    let hasAccess = chapter.is_preview;
    let progress = null;

    if (user && !hasAccess) {
      interface EnrollmentRow {
        package: string;
        grants_course_access: boolean;
      }

      // Check enrollments. Only enrollments that grant course access unlock
      // lessons; 1-on-1 coaching products give platform access but not the
      // recorded course. Consider all active enrollments so a student who
      // owns both a course and a 1v1 keeps their course access.
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("package, grants_course_access")
        .eq("user_id", user.id)
        .eq("status", "active") as { data: EnrollmentRow[] | null };

      const courseEnrollments = (enrollments || []).filter(
        (e) => e.grants_course_access
      );

      if (courseEnrollments.length > 0) {
        if (chapter.level?.required_package !== "advanced") {
          hasAccess = true;
        } else if (courseEnrollments.some((e) => e.package === "advanced")) {
          hasAccess = true;
        }
      }

      interface ProgressRow {
        watch_percentage: number;
        completed: boolean;
        last_position: number;
        watch_time: number;
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .single() as { data: ProgressRow | null };

      progress = progressData;
    }

    // Build response (title/description localized via NEXT_LOCALE cookie)
    const locale = getRequestLocale(request);
    const response: Record<string, unknown> = {
      id: chapter.id,
      levelId: chapter.level_id,
      chapterNumber: chapter.chapter_number,
      title: localized(locale, chapter.title, chapter.title_en),
      titleEn: chapter.title_en,
      description: localized(locale, chapter.description, chapter.description_en),
      descriptionEn: chapter.description_en,
      videoDuration: chapter.video_duration,
      thumbnailUrl: chapter.video_thumbnail_url,
      isPreview: chapter.is_preview,
      requiresPhotos: chapter.requires_photos,
      hasAccess,
      level: chapter.level
        ? {
            id: chapter.level.id,
            levelNumber: chapter.level.level_number,
            title: chapter.level.title,
          }
        : null,
    };

    // Include video URL only if user has access
    if (hasAccess && chapter.video_url) {
      if (chapter.video_url.startsWith("http")) {
        // Direct file URL (e.g. test/dev videos) - pass through
        response.videoUrl = chapter.video_url;
      } else {
        // Mux playback ID - generate a signed, expiring HLS URL
        response.videoUrl = generateSignedPlaybackUrl(chapter.video_url, {
          userId: user?.id,
        });
      }
    }

    // Include signed subtitle (VTT) URLs so the mobile app can render captions
    // (it can't read the HLS-embedded tracks the web player uses).
    if (hasAccess && (chapter.subtitle_hr || chapter.subtitle_en)) {
      const adminClient = createAdminClient();
      const paths = [chapter.subtitle_hr, chapter.subtitle_en].filter(
        (p): p is string => !!p
      );
      const { data: signed } = await adminClient.storage
        .from("subtitles")
        .createSignedUrls(paths, 3600);
      const urlByPath = new Map((signed || []).map((s) => [s.path, s.signedUrl]));
      if (chapter.subtitle_hr) {
        response.subtitlesHr = urlByPath.get(chapter.subtitle_hr) || null;
      }
      if (chapter.subtitle_en) {
        response.subtitlesEn = urlByPath.get(chapter.subtitle_en) || null;
      }
    }

    // Include progress if available
    if (progress) {
      response.progress = {
        watchPercentage: progress.watch_percentage,
        completed: progress.completed,
        lastPosition: progress.last_position,
        watchTime: progress.watch_time,
      };
    }

    // Include latest photo submission for practical chapters
    if (user && chapter.requires_photos) {
      interface SubmissionRow {
        id: string;
        attempt_number: number;
        photo_front_path: string;
        photo_left_path: string;
        photo_right_path: string;
        status: string;
        feedback: string | null;
        submitted_at: string;
        reviewed_at: string | null;
      }

      const { data: submission } = await supabase
        .from("photo_submissions")
        .select(
          "id, attempt_number, photo_front_path, photo_left_path, photo_right_path, status, feedback, submitted_at, reviewed_at"
        )
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .order("attempt_number", { ascending: false })
        .limit(1)
        .maybeSingle() as { data: SubmissionRow | null };

      if (submission) {
        const adminClient = createAdminClient();
        const { data: signed } = await adminClient.storage
          .from("student-work")
          .createSignedUrls(
            [
              submission.photo_front_path,
              submission.photo_left_path,
              submission.photo_right_path,
            ],
            3600
          );

        const urlByPath = new Map(
          (signed || []).map((s) => [s.path, s.signedUrl])
        );

        response.photoSubmission = {
          id: submission.id,
          attemptNumber: submission.attempt_number,
          photoFrontUrl: urlByPath.get(submission.photo_front_path) || null,
          photoLeftUrl: urlByPath.get(submission.photo_left_path) || null,
          photoRightUrl: urlByPath.get(submission.photo_right_path) || null,
          status: submission.status,
          feedback: submission.feedback,
          submittedAt: submission.submitted_at,
          reviewedAt: submission.reviewed_at,
        };
      } else {
        response.photoSubmission = null;
      }
    }

    interface AdjacentChapterRow {
      id: string;
      chapter_number: number;
      title: string;
      title_en: string | null;
    }

    // Fetch next/previous chapters for navigation
    const { data: adjacentChapters } = await supabase
      .from("chapters")
      .select("id, chapter_number, title, title_en")
      .eq("level_id", levelId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }) as { data: AdjacentChapterRow[] | null };

    if (adjacentChapters) {
      const currentIndex = adjacentChapters.findIndex((c) => c.id === chapterId);

      if (currentIndex > 0) {
        const prev = adjacentChapters[currentIndex - 1];
        response.previousChapter = {
          id: prev.id,
          chapterNumber: prev.chapter_number,
          title: localized(locale, prev.title, prev.title_en),
        };
      }

      if (currentIndex < adjacentChapters.length - 1) {
        const next = adjacentChapters[currentIndex + 1];
        response.nextChapter = {
          id: next.id,
          chapterNumber: next.chapter_number,
          title: localized(locale, next.title, next.title_en),
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get chapter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
