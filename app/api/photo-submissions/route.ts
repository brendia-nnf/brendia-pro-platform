import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSubmissionSchema = z.object({
  chapterId: z.string().uuid(),
  photoFrontPath: z.string().min(1),
  photoLeftPath: z.string().min(1),
  photoRightPath: z.string().min(1),
});

interface SubmissionRow {
  id: string;
  chapter_id: string;
  attempt_number: number;
  photo_front_path: string;
  photo_left_path: string;
  photo_right_path: string;
  status: string;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

async function signSubmissionPhotos(submissions: SubmissionRow[]) {
  const adminClient = createAdminClient();
  const paths = submissions.flatMap((s) => [
    s.photo_front_path,
    s.photo_left_path,
    s.photo_right_path,
  ]);

  const { data: signed } = await adminClient.storage
    .from("student-work")
    .createSignedUrls(paths, 3600);

  const urlByPath = new Map(
    (signed || []).map((s) => [s.path, s.signedUrl])
  );

  return submissions.map((s) => ({
    id: s.id,
    chapterId: s.chapter_id,
    attemptNumber: s.attempt_number,
    photoFrontUrl: urlByPath.get(s.photo_front_path) || null,
    photoLeftUrl: urlByPath.get(s.photo_left_path) || null,
    photoRightUrl: urlByPath.get(s.photo_right_path) || null,
    status: s.status,
    feedback: s.feedback,
    submittedAt: s.submitted_at,
    reviewedAt: s.reviewed_at,
  }));
}

// GET - Fetch own photo submissions (?chapterId= for one chapter with photos,
// otherwise a light status map across all chapters)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chapterId = request.nextUrl.searchParams.get("chapterId");

    if (chapterId) {
      const { data: submissions } = await supabase
        .from("photo_submissions")
        .select(
          "id, chapter_id, attempt_number, photo_front_path, photo_left_path, photo_right_path, status, feedback, submitted_at, reviewed_at"
        )
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .order("attempt_number", { ascending: false }) as {
          data: SubmissionRow[] | null;
        };

      const signed = await signSubmissionPhotos(submissions || []);

      return NextResponse.json({
        submissions: signed,
        latest: signed[0] || null,
      });
    }

    // Status map: latest submission status per chapter
    const { data: submissions } = await supabase
      .from("photo_submissions")
      .select("chapter_id, attempt_number, status, feedback, submitted_at")
      .eq("user_id", user.id)
      .order("attempt_number", { ascending: false }) as {
        data: Array<{
          chapter_id: string;
          attempt_number: number;
          status: string;
          feedback: string | null;
          submitted_at: string;
        }> | null;
      };

    const byChapter: Record<
      string,
      { status: string; feedback: string | null; submittedAt: string }
    > = {};

    for (const s of submissions || []) {
      if (!byChapter[s.chapter_id]) {
        byChapter[s.chapter_id] = {
          status: s.status,
          feedback: s.feedback,
          submittedAt: s.submitted_at,
        };
      }
    }

    return NextResponse.json({ byChapter });
  } catch (error) {
    console.error("Get photo submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit a photo set (front, left, right) for a chapter
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSubmissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { chapterId, photoFrontPath, photoLeftPath, photoRightPath } =
      validation.data;

    // Paths must belong to this user and chapter (uploaded via /api/photo-submissions/upload)
    const expectedPrefix = `${user.id}/${chapterId}/`;
    const paths = [photoFrontPath, photoLeftPath, photoRightPath];
    if (paths.some((p) => !p.startsWith(expectedPrefix))) {
      return NextResponse.json(
        { error: "Invalid photo paths" },
        { status: 400 }
      );
    }

    interface ChapterRow {
      id: string;
      requires_photos: boolean;
    }

    const { data: chapter } = await supabase
      .from("chapters")
      .select("id, requires_photos")
      .eq("id", chapterId)
      .eq("is_published", true)
      .single() as { data: ChapterRow | null };

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    if (!chapter.requires_photos) {
      return NextResponse.json(
        { error: "This chapter does not require photo submissions" },
        { status: 400 }
      );
    }

    interface EnrollmentRow {
      status: string;
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single() as { data: EnrollmentRow | null };

    if (!enrollment) {
      return NextResponse.json(
        { error: "No active enrollment" },
        { status: 403 }
      );
    }

    interface LatestRow {
      attempt_number: number;
      status: string;
    }

    // A new attempt is only allowed when there is no submission yet
    // or the latest one was sent back for a redo
    const { data: latest } = await supabase
      .from("photo_submissions")
      .select("attempt_number, status")
      .eq("user_id", user.id)
      .eq("chapter_id", chapterId)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .single() as { data: LatestRow | null };

    if (latest && latest.status === "pending") {
      return NextResponse.json(
        { error: "Submission is already under review" },
        { status: 400 }
      );
    }

    if (latest && latest.status === "approved") {
      return NextResponse.json(
        { error: "Submission is already approved" },
        { status: 400 }
      );
    }

    const attemptNumber = (latest?.attempt_number || 0) + 1;

    const { data: submission, error: insertError } = await supabase
      .from("photo_submissions")
      .insert({
        user_id: user.id,
        chapter_id: chapterId,
        attempt_number: attemptNumber,
        photo_front_path: photoFrontPath,
        photo_left_path: photoLeftPath,
        photo_right_path: photoRightPath,
        status: "pending",
      } as never)
      .select(
        "id, chapter_id, attempt_number, photo_front_path, photo_left_path, photo_right_path, status, feedback, submitted_at, reviewed_at"
      )
      .single() as { data: SubmissionRow | null; error: unknown };

    if (insertError || !submission) {
      console.error("Photo submission insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500 }
      );
    }

    const [signed] = await signSubmissionPhotos([submission]);

    return NextResponse.json({ success: true, submission: signed });
  } catch (error) {
    console.error("Create photo submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
