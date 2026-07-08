import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// POST - Apply for certification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current certification status
    const { data: certification, error: certError } = await supabase
      .from("certifications")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (certError && certError.code !== "PGRST116") {
      console.error("Certification fetch error:", certError);
      return NextResponse.json(
        { error: "Failed to check certification status" },
        { status: 500 }
      );
    }

    // Check if already applied or approved
    if (certification) {
      if (certification.status === "applied" || certification.status === "under_review") {
        return NextResponse.json(
          { error: "Application already submitted" },
          { status: 400 }
        );
      }

      if (certification.status === "approved") {
        return NextResponse.json(
          { error: "You are already certified" },
          { status: 400 }
        );
      }

      if (certification.status === "not_eligible") {
        // Update eligibility first
        await supabase.rpc("update_certification_eligibility", {
          p_user_id: user.id,
        });

        // Refetch
        const { data: updatedCert } = await supabase
          .from("certifications")
          .select("status")
          .eq("user_id", user.id)
          .single();

        if (updatedCert?.status === "not_eligible") {
          return NextResponse.json(
            { error: "You must complete Levels 1 and 2 before applying" },
            { status: 400 }
          );
        }
      }
    }

    // Update certification to applied status using admin client
    const { data: updatedCert, error: updateError } = await adminClient
      .from("certifications")
      .upsert(
        {
          user_id: user.id,
          status: "applied",
          applied_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (updateError) {
      console.error("Certification update error:", updateError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // TODO: Send notification email to admin
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      certification: {
        id: updatedCert.id,
        status: updatedCert.status,
        appliedAt: updatedCert.applied_at,
      },
    });
  } catch (error) {
    console.error("Apply for certification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
