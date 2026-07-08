import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch last watched chapter
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

    interface LastWatchedRow {
      chapter_id: string;
      last_position: number;
      watch_percentage: number;
    }

    interface ChapterRow {
      id: string;
      chapter_number: number;
      title: string;
      title_en: string | null;
      video_duration: number;
      video_thumbnail_url: string | null;
      level: {
        id: string;
        level_number: number;
        title: string;
      } | null;
    }

    // Get last watched using the database function
    const { data: lastWatched, error: queryError } = await supabase.rpc(
      "get_last_watched",
      { p_user_id: user.id } as never
    ) as { data: LastWatchedRow[] | null; error: unknown };

    if (queryError) {
      console.error("Last watched query error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch last watched" },
        { status: 500 }
      );
    }

    if (!lastWatched || lastWatched.length === 0) {
      // No progress yet - return first chapter of level 1
      const { data: firstChapter } = await supabase
        .from("chapters")
        .select(
          `
          id,
          chapter_number,
          title,
          title_en,
          video_duration,
          video_thumbnail_url,
          level:levels!inner (
            id,
            level_number,
            title
          )
        `
        )
        .eq("is_published", true)
        .order("level_id", { ascending: true })
        .order("sort_order", { ascending: true })
        .limit(1)
        .single() as { data: ChapterRow | null };

      if (firstChapter) {
        return NextResponse.json({
          chapterId: firstChapter.id,
          chapterNumber: firstChapter.chapter_number,
          chapterTitle: firstChapter.title,
          chapterTitleEn: firstChapter.title_en,
          levelId: firstChapter.level?.id,
          levelNumber: firstChapter.level?.level_number,
          levelTitle: firstChapter.level?.title,
          lastPosition: 0,
          watchPercentage: 0,
          videoDuration: firstChapter.video_duration,
          thumbnailUrl: firstChapter.video_thumbnail_url,
          isNew: true,
        });
      }

      return NextResponse.json({ message: "No chapters available" }, { status: 404 });
    }

    // Get chapter details
    const { data: chapter } = await supabase
      .from("chapters")
      .select(
        `
        id,
        chapter_number,
        title,
        title_en,
        video_duration,
        video_thumbnail_url,
        level:levels (
          id,
          level_number,
          title
        )
      `
      )
      .eq("id", lastWatched[0].chapter_id)
      .single() as { data: ChapterRow | null };

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      chapterId: chapter.id,
      chapterNumber: chapter.chapter_number,
      chapterTitle: chapter.title,
      chapterTitleEn: chapter.title_en,
      levelId: chapter.level?.id,
      levelNumber: chapter.level?.level_number,
      levelTitle: chapter.level?.title,
      lastPosition: lastWatched[0].last_position,
      watchPercentage: lastWatched[0].watch_percentage,
      videoDuration: chapter.video_duration,
      thumbnailUrl: chapter.video_thumbnail_url,
      isNew: false,
    });
  } catch (error) {
    console.error("Get last watched error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
