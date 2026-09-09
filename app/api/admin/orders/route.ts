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
      shippingAddress?: {
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        phone?: string;
      };
      paymentPlan?: string;
      installmentsTotal?: number | null;
      installmentsPaid?: number;
      enrollmentCompletedAt?: string | null;
      paidAt?: string | null;
    }> = [];

    let totalCount = 0;

    // Fetch course orders — the `orders` table is filled by the marketing
    // checkout and is the source of truth for who bought/paid a course,
    // including the billing address (welcome box shipping).
    if (!type || type === "all" || type === "course") {
      let courseQuery = adminClient
        .from("orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (status) {
        courseQuery = courseQuery.eq("status", status);
      }

      interface CourseOrderRow {
        id: string;
        order_number: string | null;
        customer_name: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
        company_name: string | null;
        course_name: string;
        amount: number;
        currency: string;
        status: string;
        payment_plan: string | null;
        installments_total: number | null;
        installments_paid: number | null;
        enrollment_completed_at: string | null;
        paid_at: string | null;
        created_at: string;
      }

      const { data: courseOrders, count: courseCount } = await courseQuery
        .range(from, to) as { data: CourseOrderRow[] | null; count: number | null };

      (courseOrders || []).forEach((o) => {
        orders.push({
          id: o.id,
          type: "course",
          orderNumber: o.order_number || `C-${o.id.slice(0, 8).toUpperCase()}`,
          customerName: o.customer_name,
          customerEmail: o.email,
          total: o.amount / 100,
          currency: (o.currency || "EUR").toUpperCase(),
          status: o.status,
          createdAt: o.created_at,
          paymentPlan: o.payment_plan || "full",
          installmentsTotal: o.installments_total,
          installmentsPaid: o.installments_paid ?? 0,
          enrollmentCompletedAt: o.enrollment_completed_at,
          paidAt: o.paid_at,
          items: [
            {
              name: o.course_name,
              price: o.amount / 100,
              quantity: 1,
            },
          ],
          shippingAddress: {
            fullName: o.company_name
              ? `${o.customer_name} (${o.company_name})`
              : o.customer_name,
            street: o.street,
            city: o.city,
            postalCode: o.postal_code,
            country: o.country,
            phone: o.phone,
          },
        });
      });

      totalCount += courseCount || 0;
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
        customer_phone: string | null;
        shipping_street: string;
        shipping_city: string;
        shipping_postal_code: string;
        shipping_country: string;
        shipping_phone: string | null;
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
            shippingAddress: {
              fullName: o.customer_name,
              street: o.shipping_street,
              city: o.shipping_city,
              postalCode: o.shipping_postal_code,
              country: o.shipping_country,
              phone: o.shipping_phone || o.customer_phone || undefined,
            },
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
