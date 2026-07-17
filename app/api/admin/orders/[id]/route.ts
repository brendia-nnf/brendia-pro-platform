import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const updateOrderSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  trackingNumber: z.string().optional(),
  adminNotes: z.string().optional(),
});

// PATCH - Update order status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
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

    const body = await request.json();
    const validation = updateOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status, trackingNumber, adminNotes } = validation.data;
    const adminClient = createAdminClient();

    // Build update object
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;

    // Add timestamp based on status
    if (status === "shipped") {
      updates.shipped_at = new Date().toISOString();
    } else if (status === "delivered") {
      updates.delivered_at = new Date().toISOString();
    }

    interface OrderUpdateResult {
      id: string;
      order_number: string;
      user_id: string | null;
      status: string;
      tracking_number: string | null;
      shipped_at: string | null;
      delivered_at: string | null;
    }

    const { data: order, error } = await adminClient
      .from("webshop_orders")
      .update(updates as never)
      .eq("id", orderId)
      .select()
      .single() as { data: OrderUpdateResult | null; error: unknown };

    if (error || !order) {
      console.error("Update order error:", error);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    // Notify the customer about shipping progress
    if (order.user_id && (status === "shipped" || status === "delivered")) {
      await createNotification({
        userId: order.user_id,
        type: "order",
        title:
          status === "shipped"
            ? `Narudžba ${order.order_number} je poslana`
            : `Narudžba ${order.order_number} je dostavljena`,
        body:
          status === "shipped" && order.tracking_number
            ? `Broj za praćenje: ${order.tracking_number}`
            : undefined,
        link: "/narudzbe",
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        trackingNumber: order.tracking_number,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
      },
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get single order details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
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

    interface WebshopOrderRow {
      id: string;
      order_number: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string | null;
      shipping_full_name: string;
      shipping_street: string;
      shipping_city: string;
      shipping_postal_code: string;
      shipping_country: string;
      shipping_phone: string | null;
      items: unknown;
      subtotal: number;
      shipping: number;
      discount: number;
      total: number;
      currency: string;
      coupon_code: string | null;
      status: string;
      tracking_number: string | null;
      customer_notes: string | null;
      admin_notes: string | null;
      created_at: string;
      paid_at: string | null;
      shipped_at: string | null;
      delivered_at: string | null;
    }

    const { data: order, error } = await adminClient
      .from("webshop_orders")
      .select("*")
      .eq("id", orderId)
      .single() as { data: WebshopOrderRow | null; error: unknown };

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        shippingAddress: {
          fullName: order.shipping_full_name,
          street: order.shipping_street,
          city: order.shipping_city,
          postalCode: order.shipping_postal_code,
          country: order.shipping_country,
          phone: order.shipping_phone,
        },
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        couponCode: order.coupon_code,
        status: order.status,
        trackingNumber: order.tracking_number,
        customerNotes: order.customer_notes,
        adminNotes: order.admin_notes,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
