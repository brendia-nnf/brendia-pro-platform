import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  sendPhotoSubmissionApproved,
  sendPhotoSubmissionRedo,
} from "@/lib/email/send";
import { createNotification } from "@/lib/notifications";

const reviewSubmissionSchema = z.object({
  action: z.enum(["approve", "redo"]),
  feedback: z.string().optional(),
});

// PATCH - Review a photo submission: approve or request a redo (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: submissionId } = await params;
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
    const validation = reviewSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { action, feedback } = validation.data;

    if (action === "redo" && !feedback?.trim()) {
      return NextResponse.json(
        { error: "Feedback is required when requesting a redo" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    interface SubmissionRow {
      id: string;
      user_id: string;
      chapter_id: string;
      status: string;
      chapter: { title: string } | null;
      profile: { full_name: string | null } | null;
    }

    // Fetch current submission
    const { data: submission, error: fetchError } = await adminClient
      .from("photo_submissions")
      .select(
        `
        id,
        user_id,
        chapter_id,
        status,
        chapter:chapters (title),
        profile:profiles!photo_submissions_user_id_profiles_fkey (full_name)
      `
      )
      .eq("id", submissionId)
      .single() as { data: SubmissionRow | null; error: unknown };

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Validate state transition (approved submissions are final;
    // a redo_requested one can still be approved on second thought)
    const validTransitions: Record<string, string[]> = {
      pending: ["approved", "redo_requested"],
      redo_requested: ["approved"],
    };

    const targetStatus = action === "approve" ? "approved" : "redo_requested";

    if (!validTransitions[submission.status]?.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} submission with status ${submission.status}` },
        { status: 400 }
      );
    }

    // Update submission
    const updates: Record<string, unknown> = {
      status: targetStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      feedback: feedback?.trim() || null,
    };

    const { data: updated, error: updateError } = await adminClient
      .from("photo_submissions")
      .update(updates as never)
      .eq("id", submissionId)
      .select("id, status, feedback, reviewed_at")
      .single() as {
        data: {
          id: string;
          status: string;
          feedback: string | null;
          reviewed_at: string | null;
        } | null;
        error: unknown;
      };

    if (updateError || !updated) {
      console.error("Update photo submission error:", updateError);
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    // Notify the student by email (failure must not fail the review)
    try {
      const { data: authUser } = await adminClient.auth.admin.getUserById(
        submission.user_id
      );
      const email = authUser?.user?.email;
      const name = submission.profile?.full_name || "";
      const chapterTitle = submission.chapter?.title || "";

      if (email) {
        if (action === "approve") {
          await sendPhotoSubmissionApproved(email, name, chapterTitle);
        } else {
          await sendPhotoSubmissionRedo(email, name, chapterTitle, feedback!);
        }
      }
    } catch (emailError) {
      console.error("Photo submission notification email failed:", emailError);
    }

    // In-app notification behind the dashboard bell
    await createNotification({
      userId: submission.user_id,
      type: "photo_review",
      title:
        action === "approve"
          ? "Vaš rad je odobren"
          : "Potrebne su nove fotografije rada",
      body: submission.chapter?.title
        ? `${submission.chapter.title}${feedback?.trim() ? ` — ${feedback.trim()}` : ""}`
        : feedback?.trim() || undefined,
      link: "/dashboard",
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: updated.id,
        status: updated.status,
        feedback: updated.feedback,
        reviewedAt: updated.reviewed_at,
      },
    });
  } catch (error) {
    console.error("Review photo submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
