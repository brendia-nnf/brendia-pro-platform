import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch photo submissions for review (admin only)
export async function GET(request: NextRequest) {
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

    const adminClient = createAdminClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, redo_requested, all
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    let query = adminClient
      .from("photo_submissions")
      .select(
        `
        *,
        profile:profiles!photo_submissions_user_id_profiles_fkey (
          full_name
        ),
        chapter:chapters (
          id,
          title,
          chapter_number,
          level:levels (
            level_number,
            title
          )
        )
      `,
        { count: "exact" }
      )
      .order("submitted_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    interface SubmissionRow {
      id: string;
      user_id: string;
      chapter_id: string;
      attempt_number: number;
      photo_front_path: string;
      photo_left_path: string;
      photo_right_path: string;
      status: string;
      feedback: string | null;
      submitted_at: string;
      reviewed_at: string | null;
      profile: { full_name: string | null } | null;
      chapter: {
        id: string;
        title: string;
        chapter_number: number;
        level: { level_number: number; title: string } | null;
      } | null;
    }

    const { data: submissions, error: queryError, count } = await query as {
      data: SubmissionRow[] | null;
      error: unknown;
      count: number | null;
    };

    if (queryError) {
      console.error("Photo submissions query error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch photo submissions" },
        { status: 500 }
      );
    }

    // Get user emails
    const userIds = submissions?.map((s) => s.user_id) || [];
    const { data: authUsers } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    const emailMap: Record<string, string> = {};
    authUsers?.users?.forEach((u) => {
      if (userIds.includes(u.id)) {
        emailMap[u.id] = u.email || "";
      }
    });

    // Sign photo URLs (private bucket)
    const paths = (submissions || []).flatMap((s) => [
      s.photo_front_path,
      s.photo_left_path,
      s.photo_right_path,
    ]);

    const urlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await adminClient.storage
        .from("student-work")
        .createSignedUrls(paths, 3600);
      (signed || []).forEach((s) => {
        if (s.path && s.signedUrl) {
          urlByPath.set(s.path, s.signedUrl);
        }
      });
    }

    // Format response
    const formatted = (submissions || []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      userEmail: emailMap[s.user_id] || "",
      userName: s.profile?.full_name || "",
      chapterId: s.chapter_id,
      chapterTitle: s.chapter?.title || "",
      chapterNumber: s.chapter?.chapter_number,
      levelNumber: s.chapter?.level?.level_number,
      attemptNumber: s.attempt_number,
      photoFrontUrl: urlByPath.get(s.photo_front_path) || null,
      photoLeftUrl: urlByPath.get(s.photo_left_path) || null,
      photoRightUrl: urlByPath.get(s.photo_right_path) || null,
      status: s.status,
      feedback: s.feedback,
      submittedAt: s.submitted_at,
      reviewedAt: s.reviewed_at,
    }));

    return NextResponse.json({
      submissions: formatted,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get photo submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
