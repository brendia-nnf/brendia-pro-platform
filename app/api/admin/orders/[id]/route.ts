import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

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
      .single();

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

    const { data: order, error } = await adminClient
      .from("webshop_orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Update order error:", error);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
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
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data: order, error } = await adminClient
      .from("webshop_orders")
      .select("*")
      .eq("id", orderId)
      .single();

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
