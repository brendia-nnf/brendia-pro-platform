import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

// GET - Fetch single student details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
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

    interface StudentProfileRow {
      id: string;
      full_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      created_at: string;
      role: string;
    }

    // Fetch student profile
    const { data: studentProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single() as { data: StudentProfileRow | null; error: unknown };

    if (profileError || !studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch auth user for email
    const { data: authUser } = await adminClient.auth.admin.getUserById(studentId);

    interface EnrollmentRow {
      id: string;
      course_id: string;
      package: string;
      status: string;
      amount_paid: number;
      currency: string;
      purchased_at: string;
      expires_at: string | null;
    }

    // Fetch enrollments
    const { data: enrollments } = await adminClient
      .from("enrollments")
      .select("*")
      .eq("user_id", studentId)
      .order("purchased_at", { ascending: false }) as { data: EnrollmentRow[] | null };

    interface ProgressRow {
      level_number: number;
      total_chapters: number;
      completed_chapters: number;
      progress_percentage: number;
    }

    // Fetch progress
    const { data: progress } = await adminClient.rpc("get_user_progress", {
      p_user_id: studentId,
    } as never) as { data: ProgressRow[] | null };

    interface CertificationRow {
      id: string;
      status: string;
      applied_at: string | null;
      approved_at: string | null;
      certificate_number: string | null;
    }

    // Fetch certification
    const { data: certification } = await adminClient
      .from("certifications")
      .select("*")
      .eq("user_id", studentId)
      .single() as { data: CertificationRow | null };

    interface DeviceRow {
      id: string;
      device_name: string | null;
      device_type: string | null;
      browser: string | null;
      os: string | null;
      is_current: boolean;
      last_active: string;
    }

    // Fetch devices
    const { data: devices } = await adminClient
      .from("devices")
      .select("*")
      .eq("user_id", studentId)
      .order("last_active", { ascending: false }) as { data: DeviceRow[] | null };

    return NextResponse.json({
      id: studentId,
      email: authUser?.user?.email || "",
      fullName: studentProfile.full_name,
      phone: studentProfile.phone,
      avatarUrl: studentProfile.avatar_url,
      createdAt: studentProfile.created_at,
      emailVerified: authUser?.user?.email_confirmed_at ? true : false,
      enrollments: enrollments?.map((e) => ({
        id: e.id,
        courseId: e.course_id,
        package: e.package,
        status: e.status,
        amountPaid: e.amount_paid / 100,
        currency: e.currency,
        purchasedAt: e.purchased_at,
        expiresAt: e.expires_at,
      })),
      progress: progress?.map((p) => ({
        levelNumber: p.level_number,
        totalChapters: Number(p.total_chapters),
        completedChapters: Number(p.completed_chapters),
        progressPercentage: Number(p.progress_percentage),
      })),
      certification: certification
        ? {
            id: certification.id,
            status: certification.status,
            appliedAt: certification.applied_at,
            approvedAt: certification.approved_at,
            certificateNumber: certification.certificate_number,
          }
        : null,
      devices: devices?.map((d) => ({
        id: d.id,
        deviceName: d.device_name,
        deviceType: d.device_type,
        browser: d.browser,
        os: d.os,
        isCurrent: d.is_current,
        lastActive: d.last_active,
      })),
    });
  } catch (error) {
    console.error("Get student error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateStudentSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  enrollmentStatus: z.enum(["active", "expired", "cancelled", "refunded"]).optional(),
});

// PATCH - Update student
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
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
    const validation = updateStudentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Update profile if needed
    if (validation.data.fullName || validation.data.phone !== undefined) {
      const updates: Record<string, unknown> = {};
      if (validation.data.fullName) updates.full_name = validation.data.fullName;
      if (validation.data.phone !== undefined) updates.phone = validation.data.phone;

      await adminClient
        .from("profiles")
        .update(updates as never)
        .eq("id", studentId);
    }

    // Update enrollment status if needed
    if (validation.data.enrollmentStatus) {
      await adminClient
        .from("enrollments")
        .update({ status: validation.data.enrollmentStatus } as never)
        .eq("user_id", studentId)
        .order("purchased_at", { ascending: false })
        .limit(1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update student error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
