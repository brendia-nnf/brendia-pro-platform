import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch all students (admin only)
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

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client for full access
    const adminClient = createAdminClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // active, expired, all

    // Build query
    let query = adminClient
      .from("profiles")
      .select(
        `
        id,
        full_name,
        phone,
        role,
        created_at,
        enrollments (
          id,
          course_id,
          package,
          status,
          purchased_at,
          expires_at
        ),
        certifications (
          status
        )
      `,
        { count: "exact" }
      )
      .eq("role", "user")
      .order("created_at", { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: profiles, error: queryError, count } = await query;

    if (queryError) {
      console.error("Students query error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    // Get user emails from auth
    const { data: authUsers } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    const emailMap: Record<string, string> = {};
    authUsers?.users?.forEach((u) => {
      emailMap[u.id] = u.email || "";
    });

    // Format response
    const students = (profiles || []).map((p) => {
      const activeEnrollment = p.enrollments?.find(
        (e: { status: string }) => e.status === "active"
      );

      return {
        id: p.id,
        email: emailMap[p.id] || "",
        fullName: p.full_name,
        phone: p.phone,
        createdAt: p.created_at,
        enrollment: activeEnrollment
          ? {
              courseId: activeEnrollment.course_id,
              package: activeEnrollment.package,
              status: activeEnrollment.status,
              purchasedAt: activeEnrollment.purchased_at,
              expiresAt: activeEnrollment.expires_at,
            }
          : null,
        certificationStatus: p.certifications?.[0]?.status || "not_eligible",
      };
    });

    // Filter by status if specified
    let filteredStudents = students;
    if (status && status !== "all") {
      filteredStudents = students.filter((s) =>
        status === "active"
          ? s.enrollment?.status === "active"
          : s.enrollment?.status !== "active"
      );
    }

    return NextResponse.json({
      students: filteredStudents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
