import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const createChapterSchema = z.object({
  levelId: z.string().uuid(),
  title: z.string().trim().min(1),
  titleEn: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  descriptionEn: z.string().trim().nullable().optional(),
  videoDuration: z.number().int().min(0).optional(), // seconds
  isPublished: z.boolean().optional(),
});

// POST - Create a new chapter (admin only)
export async function POST(request: NextRequest) {
  try {
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
    const validation = createChapterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { levelId, title, titleEn, description, descriptionEn, videoDuration, isPublished } =
      validation.data;

    const adminClient = createAdminClient();

    // Verify level exists
    const { data: level } = await adminClient
      .from("levels")
      .select("id")
      .eq("id", levelId)
      .single() as { data: { id: string } | null };

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Next chapter number / sort order within the level
    const { data: lastChapter } = await adminClient
      .from("chapters")
      .select("chapter_number, sort_order")
      .eq("level_id", levelId)
      .order("chapter_number", { ascending: false })
      .limit(1)
      .maybeSingle() as {
        data: { chapter_number: number; sort_order: number } | null;
      };

    const chapterNumber = (lastChapter?.chapter_number || 0) + 1;
    const sortOrder = (lastChapter?.sort_order || 0) + 1;

    const { data: created, error: insertError } = await adminClient
      .from("chapters")
      .insert({
        level_id: levelId,
        chapter_number: chapterNumber,
        sort_order: sortOrder,
        title,
        title_en: titleEn || null,
        description: description || null,
        description_en: descriptionEn || null,
        video_duration: videoDuration || 0,
        is_preview: false,
        is_published: isPublished !== false,
        requires_photos: false,
      } as never)
      .select("id, chapter_number, title, video_duration, is_published")
      .single() as {
        data: {
          id: string;
          chapter_number: number;
          title: string;
          video_duration: number;
          is_published: boolean;
        } | null;
        error: unknown;
      };

    if (insertError || !created) {
      console.error("Create chapter error:", insertError);
      return NextResponse.json(
        { error: "Failed to create chapter" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chapter: {
        id: created.id,
        chapterNumber: created.chapter_number,
        title: created.title,
        videoDuration: created.video_duration,
        isPublished: created.is_published,
      },
    });
  } catch (error) {
    console.error("Create chapter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
