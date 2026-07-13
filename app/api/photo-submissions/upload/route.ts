import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

const ANGLES = ["front", "left", "right"] as const;

// POST - Upload a single work photo (student) to the private student-work bucket
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const chapterId = formData.get("chapterId") as string;
    const angle = formData.get("angle") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!chapterId || !ANGLES.includes(angle as (typeof ANGLES)[number])) {
      return NextResponse.json(
        { error: "chapterId and angle (front/left/right) are required" },
        { status: 400 }
      );
    }

    // Validate file type (phone cameras produce JPEG/HEIC)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB - phone photos)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    interface ChapterRow {
      id: string;
      requires_photos: boolean;
    }

    // Verify chapter exists and requires photo submissions
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

    // Check enrollment
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

    // Generate filename scoped to the user (private bucket)
    const timestamp = Date.now();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/${chapterId}/${timestamp}-${angle}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from("student-work")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Photo upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload photo" },
        { status: 500 }
      );
    }

    // Signed URL for immediate preview (bucket is private)
    const { data: signedData } = await adminClient.storage
      .from("student-work")
      .createSignedUrl(data.path, 3600);

    return NextResponse.json({
      success: true,
      path: data.path,
      url: signedData?.signedUrl || null,
      angle,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
