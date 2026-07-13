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

      interface EnrollmentRow {
        id: string;
        user_id: string;
        course_id: string;
        package: string;
        status: string;
        amount_paid: number;
        currency: string;
        purchased_at: string;
      }

      const { data: enrollments, count: enrollmentCount } = await enrollmentQuery
        .range(from, to) as { data: EnrollmentRow[] | null; count: number | null };

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
          // Actual course_id values used by enrollments (from marketing checkout)
          "foundation-certification": "Brendia Pro® Artist",
          "master-certification": "Advanced Brendia Pro® Artist",
          "brendia-pro-artist-1v1": "Brendia Pro® Artist 1v1",
          "brendia-pro-master-1v1": "Brendia Pro® Master 1v1",
          // Legacy short ids (fallback)
          foundation: "Brendia Pro® Artist",
          master: "Advanced Brendia Pro® Artist",
          advanced: "Advanced Brendia Pro® Artist",
        };

        enrollments.forEach((e) => {
          const productName = courseNames[e.course_id] || e.course_id;
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
            items: [
              {
                name: productName,
                package: e.package,
                price: e.amount_paid / 100,
                quantity: 1,
              },
            ],
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

      interface WebshopOrderRow {
        id: string;
        order_number: string;
        customer_name: string;
        customer_email: string;
        total: number;
        currency: string;
        status: string;
        created_at: string;
        items: unknown;
      }

      const { data: webshopOrders, count: webshopCount } = await webshopQuery
        .range(from, to) as { data: WebshopOrderRow[] | null; count: number | null };

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
