import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { generateCertificatePDF } from "@/lib/certificates/generate";

const updateCertificationSchema = z.object({
  action: z.enum(["approve", "reject", "review"]),
  rejectionReason: z.string().optional(),
  reviewNotes: z.string().optional(),
});

// PATCH - Update certification status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificationId } = await params;
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
    const validation = updateCertificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { action, rejectionReason, reviewNotes } = validation.data;

    const adminClient = createAdminClient();

    // Fetch current certification
    const { data: certification, error: fetchError } = await adminClient
      .from("certifications")
      .select("*")
      .eq("id", certificationId)
      .single() as { data: { id: string; status: string; user_id: string } | null; error: unknown };

    if (fetchError || !certification) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 }
      );
    }

    // Validate state transition
    const validTransitions: Record<string, string[]> = {
      applied: ["under_review", "approved", "rejected"],
      under_review: ["approved", "rejected"],
      rejected: ["under_review", "approved"],
    };

    const targetStatus =
      action === "approve" ? "approved" : action === "reject" ? "rejected" : "under_review";

    if (!validTransitions[certification.status]?.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} certification with status ${certification.status}` },
        { status: 400 }
      );
    }

    // Build update
    const updates: Record<string, unknown> = {
      status: targetStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (reviewNotes) {
      updates.review_notes = reviewNotes;
    }

    if (action === "approve") {
      updates.approved_at = new Date().toISOString();

      // Generate certificate number
      const { data: certNumber } = await adminClient.rpc("generate_certificate_number");
      updates.certificate_number = certNumber;

      // Generate certificate PDF and upload to storage
      if (certNumber) {
        const certificateUrl = await generateCertificatePDF(
          certification.user_id,
          certNumber
        );
        if (certificateUrl) {
          updates.certificate_url = certificateUrl;
        }
      }
    }

    if (action === "reject") {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }
      updates.rejection_reason = rejectionReason;
    }

    // Update certification
    const { data: updated, error: updateError } = await adminClient
      .from("certifications")
      .update(updates)
      .eq("id", certificationId)
      .select()
      .single();

    if (updateError) {
      console.error("Update certification error:", updateError);
      return NextResponse.json(
        { error: "Failed to update certification" },
        { status: 500 }
      );
    }

    // TODO: Send email notification to user
    // if (action === 'approve') {
    //   await sendCertificationApprovedEmail(certification.user_id, updated.certificate_url);
    // } else if (action === 'reject') {
    //   await sendCertificationRejectedEmail(certification.user_id, rejectionReason);
    // }

    return NextResponse.json({
      success: true,
      certification: {
        id: updated.id,
        status: updated.status,
        certificateNumber: updated.certificate_number,
        approvedAt: updated.approved_at,
        rejectionReason: updated.rejection_reason,
      },
    });
  } catch (error) {
    console.error("Update certification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
