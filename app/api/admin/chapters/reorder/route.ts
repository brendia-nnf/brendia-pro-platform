import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const reorderSchema = z.object({
  levelId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});

// POST - Reorder the chapters of a level (admin only).
// Renumbers both sort_order (playback/list order) and chapter_number
// (displayed numbering) to match the given order.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = reorderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    const { levelId, orderedIds } = validation.data;

    const adminClient = createAdminClient();
    const { data: chapters, error: fetchError } = await adminClient
      .from("chapters")
      .select("id")
      .eq("level_id", levelId) as {
        data: Array<{ id: string }> | null;
        error: unknown;
      };

    if (fetchError || !chapters) {
      return NextResponse.json(
        { error: "Failed to fetch chapters" },
        { status: 500 }
      );
    }

    // The submitted order must contain exactly this level's chapters
    const existing = new Set(chapters.map((c) => c.id));
    if (
      orderedIds.length !== existing.size ||
      !orderedIds.every((id) => existing.has(id))
    ) {
      return NextResponse.json(
        { error: "orderedIds must match the level's chapters exactly" },
        { status: 400 }
      );
    }

    // chapter_number has UNIQUE(level_id, chapter_number) — go through a
    // negative-number phase so intermediate states never collide.
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await adminClient
        .from("chapters")
        .update({ chapter_number: -(i + 1), sort_order: -(i + 1) } as never)
        .eq("id", orderedIds[i]);
      if (error) {
        console.error("Reorder phase 1 failed:", error);
        return NextResponse.json(
          { error: "Failed to reorder chapters" },
          { status: 500 }
        );
      }
    }
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await adminClient
        .from("chapters")
        .update({ chapter_number: i + 1, sort_order: i + 1 } as never)
        .eq("id", orderedIds[i]);
      if (error) {
        console.error("Reorder phase 2 failed:", error);
        return NextResponse.json(
          { error: "Failed to reorder chapters" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder chapters error:", error);
    return NextResponse.json(
      { error: "Failed to reorder chapters" },
      { status: 500 }
    );
  }
}
