import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Coupon } from "@/lib/supabase/types";

const createCouponSchema = z.object({
  code: z.string().min(3).max(50).transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  minimumOrder: z.number().optional(),
  maximumDiscount: z.number().optional(),
  usageLimit: z.number().optional(),
  onePerCustomer: z.boolean().optional().default(false),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

// GET - Fetch all coupons (admin only)
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
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const activeOnly = searchParams.get("active") === "true";

    let query = adminClient
      .from("coupons")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: coupons, error, count } = await query as { data: Coupon[] | null; error: unknown; count: number | null };

    if (error) {
      console.error("Coupons query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch coupons" },
        { status: 500 }
      );
    }

    const formattedCoupons = (coupons || []).map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discount_type,
      discountValue: c.discount_value,
      minimumOrder: c.minimum_order,
      maximumDiscount: c.maximum_discount,
      usageLimit: c.usage_limit,
      usageCount: c.usage_count,
      onePerCustomer: c.one_per_customer,
      startsAt: c.starts_at,
      expiresAt: c.expires_at,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));

    return NextResponse.json({
      coupons: formattedCoupons,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new coupon (admin only)
export async function POST(request: NextRequest) {
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
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const adminClient = createAdminClient();

    // Check for duplicate code
    const { data: existing } = await adminClient
      .from("coupons")
      .select("id")
      .eq("code", data.code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    const { data: coupon, error } = await adminClient
      .from("coupons")
      .insert({
        code: data.code,
        description: data.description,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        minimum_order: data.minimumOrder,
        maximum_discount: data.maximumDiscount,
        usage_limit: data.usageLimit,
        one_per_customer: data.onePerCustomer,
        starts_at: data.startsAt || new Date().toISOString(),
        expires_at: data.expiresAt,
        is_active: data.isActive,
      } as Coupon)
      .select()
      .single() as { data: Coupon | null; error: unknown };

    if (error) {
      console.error("Create coupon error:", error);
      return NextResponse.json(
        { error: "Failed to create coupon" },
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
      },
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
