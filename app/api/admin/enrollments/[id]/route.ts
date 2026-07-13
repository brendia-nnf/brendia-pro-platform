import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sendWelcomeBoxShipped } from "@/lib/email/send";

const updateEnrollmentSchema = z.object({
  kitStatus: z.enum(["preparing", "shipped", "delivered"]),
  trackingNumber: z.string().trim().optional(),
});

// PATCH - Update enrollment kit status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: enrollmentId } = await params;
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
    const validation = updateEnrollmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { kitStatus, trackingNumber } = validation.data;

    const adminClient = createAdminClient();

    interface EnrollmentRow {
      id: string;
      user_id: string;
      kit_status: string | null;
      profile: { full_name: string | null } | null;
    }

    const { data: enrollment, error: fetchError } = await adminClient
      .from("enrollments")
      .select(
        `
        id,
        user_id,
        kit_status,
        profile:profiles!enrollments_user_id_profiles_fkey (full_name)
      `
      )
      .eq("id", enrollmentId)
      .single() as { data: EnrollmentRow | null; error: unknown };

    if (fetchError || !enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      kit_status: kitStatus,
    };

    if (trackingNumber !== undefined) {
      updates.kit_tracking_number = trackingNumber || null;
    }

    const becameShipped =
      kitStatus === "shipped" && enrollment.kit_status !== "shipped";

    if (becameShipped) {
      updates.kit_shipped_at = new Date().toISOString();
    }

    const { error: updateError } = await adminClient
      .from("enrollments")
      .update(updates as never)
      .eq("id", enrollmentId);

    if (updateError) {
      console.error("Update enrollment error:", updateError);
      return NextResponse.json(
        { error: "Failed to update enrollment" },
        { status: 500 }
      );
    }

    // Notify the student when the kit ships (failure must not fail the update)
    if (becameShipped) {
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(
          enrollment.user_id
        );
        const email = authUser?.user?.email;
        if (email) {
          await sendWelcomeBoxShipped(
            email,
            enrollment.profile?.full_name || "",
            trackingNumber || ""
          );
        }
      } catch (emailError) {
        console.error("Kit shipped email failed:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        kitStatus,
        trackingNumber: trackingNumber || null,
      },
    });
  } catch (error) {
    console.error("Update enrollment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
