import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateChapterSchema = z
  .object({
    requiresPhotos: z.boolean().optional(),
    videoUrl: z.string().trim().nullable().optional(), // Mux playback ID or direct URL
    title: z.string().trim().min(1).optional(),
    titleEn: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    descriptionEn: z.string().trim().nullable().optional(),
    videoDuration: z.number().int().min(0).optional(), // seconds
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

// PATCH - Update chapter settings (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
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
    const validation = updateChapterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      requiresPhotos,
      videoUrl,
      title,
      titleEn,
      description,
      descriptionEn,
      videoDuration,
      isPublished,
    } = validation.data;

    const updates: Record<string, unknown> = {};
    if (requiresPhotos !== undefined) {
      updates.requires_photos = requiresPhotos;
    }
    if (videoUrl !== undefined) {
      updates.video_url = videoUrl || null;
    }
    if (title !== undefined) {
      updates.title = title;
    }
    if (titleEn !== undefined) {
      updates.title_en = titleEn || null;
    }
    if (description !== undefined) {
      updates.description = description || null;
    }
    if (descriptionEn !== undefined) {
      updates.description_en = descriptionEn || null;
    }
    if (videoDuration !== undefined) {
      updates.video_duration = videoDuration;
    }
    if (isPublished !== undefined) {
      updates.is_published = isPublished;
    }

    const adminClient = createAdminClient();
    const { data: updated, error: updateError } = await adminClient
      .from("chapters")
      .update(updates as never)
      .eq("id", chapterId)
      .select("id, title, title_en, description, description_en, video_duration, requires_photos, video_url, is_published")
      .single() as {
        data: {
          id: string;
          title: string;
          title_en: string | null;
          description: string | null;
          description_en: string | null;
          video_duration: number;
          requires_photos: boolean;
          video_url: string | null;
          is_published: boolean;
        } | null;
        error: unknown;
      };

    if (updateError || !updated) {
      console.error("Update chapter error:", updateError);
      return NextResponse.json(
        { error: "Failed to update chapter" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chapter: {
        id: updated.id,
        title: updated.title,
        titleEn: updated.title_en,
        description: updated.description,
        descriptionEn: updated.description_en,
        videoDuration: updated.video_duration,
        requiresPhotos: updated.requires_photos,
        videoUrl: updated.video_url,
        isPublished: updated.is_published,
      },
    });
  } catch (error) {
    console.error("Update chapter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a chapter (admin only). Cascades progress and photo
// submissions for this chapter via FK constraints.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
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

    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient
      .from("chapters")
      .delete()
      .eq("id", chapterId);

    if (deleteError) {
      console.error("Delete chapter error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete chapter" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chapter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
