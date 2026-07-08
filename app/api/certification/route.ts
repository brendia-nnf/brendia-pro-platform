import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch user's certification status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    type CertificationData = Parameters<typeof formatCertification>[0];

    // Fetch certification
    const { data: certification, error: certError } = await supabase
      .from("certifications")
      .select("*")
      .eq("user_id", user.id)
      .single() as { data: CertificationData | null; error: { code?: string } | null };

    // If no certification record exists, check eligibility and create one
    if (certError && certError.code === "PGRST116") {
      // Update eligibility (this will create a record)
      await supabase.rpc("update_certification_eligibility", {
        p_user_id: user.id,
      } as never);

      // Fetch again
      const { data: newCert } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", user.id)
        .single() as { data: CertificationData | null };

      if (newCert) {
        return NextResponse.json(formatCertification(newCert));
      }

      return NextResponse.json({
        status: "not_eligible",
        requirements: {
          level1Completed: false,
          level2Completed: false,
        },
      });
    }

    if (certError || !certification) {
      console.error("Certification fetch error:", certError);
      return NextResponse.json(
        { error: "Failed to fetch certification" },
        { status: 500 }
      );
    }

    return NextResponse.json(formatCertification(certification));
  } catch (error) {
    console.error("Get certification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatCertification(cert: {
  id: string;
  status: string;
  applied_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  certificate_number: string | null;
  certificate_url: string | null;
  level1_completed_at: string | null;
  level2_completed_at: string | null;
  level3_completed_at: string | null;
}) {
  return {
    id: cert.id,
    status: cert.status,
    appliedAt: cert.applied_at,
    reviewedAt: cert.reviewed_at,
    approvedAt: cert.approved_at,
    rejectionReason: cert.rejection_reason,
    certificateNumber: cert.certificate_number,
    certificateUrl: cert.certificate_url,
    requirements: {
      level1Completed: !!cert.level1_completed_at,
      level1CompletedAt: cert.level1_completed_at,
      level2Completed: !!cert.level2_completed_at,
      level2CompletedAt: cert.level2_completed_at,
      level3Completed: !!cert.level3_completed_at,
      level3CompletedAt: cert.level3_completed_at,
    },
  };
}
