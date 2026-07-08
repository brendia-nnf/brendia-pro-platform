// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch all orders (admin only)
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
    const type = searchParams.get("type"); // course, webshop, all
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const orders: Array<{
      id: string;
      type: "course" | "webshop";
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      total: number;
      currency: string;
      status: string;
      createdAt: string;
      items?: unknown;
    }> = [];

    let totalCount = 0;

    // Fetch course enrollments
    if (!type || type === "all" || type === "course") {
      let enrollmentQuery = adminClient
        .from("enrollments")
        .select("*", { count: "exact" })
        .order("purchased_at", { ascending: false });

      if (status) {
        enrollmentQuery = enrollmentQuery.eq("status", status);
      }

      const { data: enrollments, count: enrollmentCount } = await enrollmentQuery
        .range(from, to);

      // Get user info for enrollments
      if (enrollments && enrollments.length > 0) {
        const userIds = [...new Set(enrollments.map((e) => e.user_id))];
        const { data: authUsers } = await adminClient.auth.admin.listUsers({
          perPage: 1000,
        });

        const userMap: Record<string, { email: string; fullName: string }> = {};
        authUsers?.users?.forEach((u) => {
          if (userIds.includes(u.id)) {
            userMap[u.id] = {
              email: u.email || "",
              fullName: u.user_metadata?.full_name || "",
            };
          }
        });

        const courseNames: Record<string, string> = {
          foundation: "Brendia Pro Artist",
          master: "Brendia Pro Master",
          advanced: "Advanced Brendia Pro Artist",
        };

        enrollments.forEach((e) => {
          orders.push({
            id: e.id,
            type: "course",
            orderNumber: `C-${e.id.slice(0, 8).toUpperCase()}`,
            customerName: userMap[e.user_id]?.fullName || "",
            customerEmail: userMap[e.user_id]?.email || "",
            total: e.amount_paid / 100,
            currency: e.currency,
            status: e.status,
            createdAt: e.purchased_at,
          });
        });

        totalCount += enrollmentCount || 0;
      }
    }

    // Fetch webshop orders
    if (!type || type === "all" || type === "webshop") {
      let webshopQuery = adminClient
        .from("webshop_orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (status) {
        webshopQuery = webshopQuery.eq("status", status);
      }

      const { data: webshopOrders, count: webshopCount } = await webshopQuery
        .range(from, to);

      if (webshopOrders) {
        webshopOrders.forEach((o) => {
          orders.push({
            id: o.id,
            type: "webshop",
            orderNumber: o.order_number,
            customerName: o.customer_name,
            customerEmail: o.customer_email,
            total: o.total / 100,
            currency: o.currency,
            status: o.status,
            createdAt: o.created_at,
            items: o.items,
          });
        });

        totalCount += webshopCount || 0;
      }
    }

    // Sort combined orders by date
    orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
