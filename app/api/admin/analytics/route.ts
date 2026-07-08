import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch analytics data (admin only)
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

    // Parse date range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total students
    const { count: totalStudents } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    // Get active enrollments
    const { count: activeEnrollments } = await adminClient
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Get new students in period
    const { count: newStudents } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", startDate.toISOString());

    // Get revenue in period
    const { data: revenueData } = await adminClient
      .from("enrollments")
      .select("amount_paid, purchased_at")
      .eq("status", "active")
      .gte("purchased_at", startDate.toISOString()) as { data: Array<{ amount_paid: number; purchased_at: string }> | null };

    const totalRevenue = revenueData?.reduce((sum, e) => sum + e.amount_paid, 0) || 0;

    // Get certifications stats
    const { data: certStats } = await adminClient
      .from("certifications")
      .select("status")
      .in("status", ["applied", "under_review", "approved"]) as { data: Array<{ status: string }> | null };

    const pendingCertifications = certStats?.filter(
      (c) => c.status === "applied" || c.status === "under_review"
    ).length || 0;

    const approvedCertifications = certStats?.filter(
      (c) => c.status === "approved"
    ).length || 0;

    // Get course completion rates
    const { data: progressData } = await adminClient
      .from("progress")
      .select("user_id, completed") as { data: Array<{ user_id: string; completed: boolean }> | null };

    const usersWithProgress = new Set(progressData?.map((p) => p.user_id) || []);
    const completedChapters = progressData?.filter((p) => p.completed).length || 0;
    const totalProgressEntries = progressData?.length || 0;
    const avgCompletionRate =
      totalProgressEntries > 0
        ? Math.round((completedChapters / totalProgressEntries) * 100)
        : 0;

    // Get webshop stats
    const { data: webshopOrders } = await adminClient
      .from("webshop_orders")
      .select("total, status, created_at")
      .gte("created_at", startDate.toISOString()) as { data: Array<{ total: number; status: string; created_at: string }> | null };

    const webshopRevenue = webshopOrders
      ?.filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + o.total, 0) || 0;

    // Get enrollments by package
    const { data: packageData } = await adminClient
      .from("enrollments")
      .select("package")
      .eq("status", "active") as { data: Array<{ package: string }> | null };

    const packageBreakdown = {
      basic: packageData?.filter((e) => e.package === "basic").length || 0,
      advanced: packageData?.filter((e) => e.package === "advanced").length || 0,
    };

    return NextResponse.json({
      overview: {
        totalStudents: totalStudents || 0,
        activeEnrollments: activeEnrollments || 0,
        newStudents: newStudents || 0,
        studentsWithProgress: usersWithProgress.size,
      },
      revenue: {
        courseRevenue: totalRevenue / 100,
        webshopRevenue: webshopRevenue / 100,
        totalRevenue: (totalRevenue + webshopRevenue) / 100,
        currency: "EUR",
        periodDays: days,
      },
      certifications: {
        pending: pendingCertifications,
        approved: approvedCertifications,
        total: certStats?.length || 0,
      },
      courses: {
        avgCompletionRate,
        packageBreakdown,
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
