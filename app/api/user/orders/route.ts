import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";

// GET - Fetch the student's webshop orders
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

    interface OrderRow {
      id: string;
      order_number: string;
      items: Array<{
        productId?: string;
        name?: string;
        price?: number;
        quantity?: number;
        subtotal?: number;
      }> | null;
      subtotal: number;
      shipping: number;
      discount: number;
      total: number;
      currency: string;
      status: string;
      tracking_number: string | null;
      created_at: string;
      paid_at: string | null;
      shipped_at: string | null;
      delivered_at: string | null;
    }

    // Orders linked by user_id, plus older guest orders matched by the
    // account email (orders were not linked to users before mid-2026)
    const admin = createAdminClient();
    const { data: orders, error } = await admin
      .from("webshop_orders")
      .select(
        "id, order_number, items, subtotal, shipping, discount, total, currency, status, tracking_number, created_at, paid_at, shipped_at, delivered_at"
      )
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order("created_at", { ascending: false }) as {
        data: OrderRow[] | null;
        error: unknown;
      };

    if (error) {
      console.error("Fetch orders error:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orders: (orders || []).map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        items: (order.items || []).map((item) => ({
          name: item.name || "",
          price: item.price || 0,
          quantity: item.quantity || 0,
          subtotal: item.subtotal || 0,
        })),
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        status: order.status,
        trackingNumber: order.tracking_number,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
      })),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
