import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch all certification applications (admin only)
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
    const status = searchParams.get("status"); // applied, under_review, approved, rejected, all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    let query = adminClient
      .from("certifications")
      .select(
        `
        *,
        profile:profiles!inner (
          full_name,
          phone
        )
      `,
        { count: "exact" }
      )
      .order("applied_at", { ascending: false, nullsFirst: false });

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    } else {
      // By default, show applications (not 'not_eligible' or 'eligible')
      query = query.in("status", ["applied", "under_review", "approved", "rejected"]);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: certifications, error: queryError, count } = await query;

    if (queryError) {
      console.error("Certifications query error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch certifications" },
        { status: 500 }
      );
    }

    // Get user emails
    const userIds = certifications?.map((c) => c.user_id) || [];
    const { data: authUsers } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    const emailMap: Record<string, string> = {};
    authUsers?.users?.forEach((u) => {
      if (userIds.includes(u.id)) {
        emailMap[u.id] = u.email || "";
      }
    });

    // Format response
    const applications = (certifications || []).map((c) => ({
      id: c.id,
      userId: c.user_id,
      userEmail: emailMap[c.user_id] || "",
      userName: c.profile?.full_name || "",
      userPhone: c.profile?.phone,
      status: c.status,
      appliedAt: c.applied_at,
      reviewedAt: c.reviewed_at,
      approvedAt: c.approved_at,
      rejectionReason: c.rejection_reason,
      certificateNumber: c.certificate_number,
      level1CompletedAt: c.level1_completed_at,
      level2CompletedAt: c.level2_completed_at,
    }));

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get certifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
