import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch kit (welcome box) status for the user's active enrollment
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

    interface EnrollmentRow {
      kit_status: string | null;
      kit_tracking_number: string | null;
      kit_shipped_at: string | null;
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("kit_status, kit_tracking_number, kit_shipped_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("purchased_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: EnrollmentRow | null };

    if (!enrollment) {
      return NextResponse.json({ kit: null });
    }

    return NextResponse.json({
      kit: {
        status: enrollment.kit_status || "preparing",
        trackingNumber: enrollment.kit_tracking_number,
        shippedAt: enrollment.kit_shipped_at,
      },
    });
  } catch (error) {
    console.error("Get kit status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
