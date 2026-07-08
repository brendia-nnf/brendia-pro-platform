// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Check access
    let hasAccess = chapter.is_preview;
    let enrollment = null;
    let progress = null;

    if (user && !hasAccess) {
      // Check enrollment
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("purchased_at", { ascending: false })
        .limit(1)
        .single();

      enrollment = enrollmentData;

      if (enrollment) {
        const levelNum = chapter.level?.level_number || 1;
        if (levelNum <= 2) {
          hasAccess = true;
        } else if (levelNum === 3 && enrollment.package === "advanced") {
          hasAccess = true;
        }
      }

      // Fetch progress
      const { data: progressData } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .single();

      progress = progressData;
    }

    // Build response
    const response: Record<string, unknown> = {
      id: chapter.id,
      levelId: chapter.level_id,
      chapterNumber: chapter.chapter_number,
      title: chapter.title,
      titleEn: chapter.title_en,
      description: chapter.description,
      descriptionEn: chapter.description_en,
      videoDuration: chapter.video_duration,
      thumbnailUrl: chapter.video_thumbnail_url,
      isPreview: chapter.is_preview,
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
      // For Mux, generate a signed URL
      // For direct URLs, just return them
      response.videoUrl = chapter.video_url;

      // If using Mux, would generate signed playback URL here
      // response.videoUrl = await generateMuxSignedUrl(chapter.video_url);
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

    // Fetch next/previous chapters for navigation
    const { data: adjacentChapters } = await supabase
      .from("chapters")
      .select("id, chapter_number, title")
      .eq("level_id", levelId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (adjacentChapters) {
      const currentIndex = adjacentChapters.findIndex((c) => c.id === chapterId);

      if (currentIndex > 0) {
        const prev = adjacentChapters[currentIndex - 1];
        response.previousChapter = {
          id: prev.id,
          chapterNumber: prev.chapter_number,
          title: prev.title,
        };
      }

      if (currentIndex < adjacentChapters.length - 1) {
        const next = adjacentChapters[currentIndex + 1];
        response.nextChapter = {
          id: next.id,
          chapterNumber: next.chapter_number,
          title: next.title,
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
