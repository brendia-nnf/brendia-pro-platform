import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateCouponSchema = z.object({
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().positive().optional(),
  minimumOrder: z.number().nullable().optional(),
  maximumDiscount: z.number().nullable().optional(),
  usageLimit: z.number().nullable().optional(),
  onePerCustomer: z.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// PATCH - Update coupon (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: couponId } = await params;
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
    const validation = updateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const adminClient = createAdminClient();

    // Build update object
    const updates: Record<string, unknown> = {};

    if (data.description !== undefined) updates.description = data.description;
    if (data.discountType !== undefined) updates.discount_type = data.discountType;
    if (data.discountValue !== undefined) updates.discount_value = data.discountValue;
    if (data.minimumOrder !== undefined) updates.minimum_order = data.minimumOrder;
    if (data.maximumDiscount !== undefined) updates.maximum_discount = data.maximumDiscount;
    if (data.usageLimit !== undefined) updates.usage_limit = data.usageLimit;
    if (data.onePerCustomer !== undefined) updates.one_per_customer = data.onePerCustomer;
    if (data.startsAt !== undefined) updates.starts_at = data.startsAt;
    if (data.expiresAt !== undefined) updates.expires_at = data.expiresAt;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    updates.updated_at = new Date().toISOString();

    interface CouponRow {
      id: string;
      code: string;
      discount_type: string;
      discount_value: number;
      is_active: boolean;
      usage_count: number;
      usage_limit: number | null;
    }

    const { data: coupon, error } = await adminClient
      .from("coupons")
      .update(updates as never)
      .eq("id", couponId)
      .select()
      .single() as { data: CouponRow | null; error: unknown };

    if (error || !coupon) {
      console.error("Update coupon error:", error);
      return NextResponse.json(
        { error: "Failed to update coupon" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        isActive: coupon.is_active,
        usageCount: coupon.usage_count,
        usageLimit: coupon.usage_limit,
      },
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete coupon (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: couponId } = await params;
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

    // Check if coupon has been used
    const { data: coupon } = await adminClient
      .from("coupons")
      .select("usage_count")
      .eq("id", couponId)
      .single() as { data: { usage_count: number } | null };

    if (coupon && coupon.usage_count > 0) {
      // Soft delete - just deactivate
      await adminClient
        .from("coupons")
        .update({ is_active: false, updated_at: new Date().toISOString() } as never)
        .eq("id", couponId);

      return NextResponse.json({
        success: true,
        message: "Coupon has been deactivated (cannot delete coupons that have been used)",
      });
    }

    // Hard delete if never used
    const { error } = await adminClient
      .from("coupons")
      .delete()
      .eq("id", couponId);

    if (error) {
      console.error("Delete coupon error:", error);
      return NextResponse.json(
        { error: "Failed to delete coupon" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
