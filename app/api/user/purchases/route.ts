import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch user purchases (enrollments + webshop orders)
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
      id: string;
      course_id: string;
      amount_paid: number;
      currency: string;
      status: string;
      purchased_at: string;
    }

    // Fetch course enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false }) as { data: EnrollmentRow[] | null; error: unknown };

    if (enrollmentsError) {
      console.error("Fetch enrollments error:", enrollmentsError);
    }

    interface OrderRow {
      id: string;
      order_number: string;
      total: number;
      currency: string;
      status: string;
      created_at: string;
    }

    // Fetch webshop orders
    const { data: orders, error: ordersError } = await supabase
      .from("webshop_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as { data: OrderRow[] | null; error: unknown };

    if (ordersError) {
      console.error("Fetch orders error:", ordersError);
    }

    // Combine and format purchases
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

    const purchases = [
      ...(enrollments || []).map((e) => ({
        id: e.id,
        type: "course" as const,
        description: courseNames[e.course_id] || e.course_id,
        amount: e.amount_paid / 100,
        currency: e.currency,
        status: e.status,
        date: e.purchased_at,
      })),
      ...(orders || []).map((o) => ({
        id: o.id,
        type: "webshop" as const,
        description: `Order #${o.order_number}`,
        amount: o.total / 100,
        currency: o.currency,
        status: o.status,
        date: o.created_at,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Get purchases error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
