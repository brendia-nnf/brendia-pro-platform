import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const supabase = createAdminClient();

    interface ProductRow {
      id: string;
      name: string;
      name_en: string | null;
      slug: string;
      description: string | null;
      description_en: string | null;
      price: number;
      original_price: number | null;
      currency: string;
      category: string;
      images: string[];
      in_stock: boolean;
      stock_quantity: number;
      specifications: Record<string, unknown>;
      featured: boolean;
      is_published: boolean;
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single() as { data: ProductRow | null; error: unknown };

    if (error || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        nameEn: product.name_en,
        slug: product.slug,
        description: product.description || "",
        descriptionEn: product.description_en,
        price: product.price / 100,
        originalPrice: product.original_price ? product.original_price / 100 : undefined,
        currency: product.currency,
        category: product.category,
        images: product.images || [],
        inStock: product.in_stock,
        stockQuantity: product.stock_quantity,
        specifications: product.specifications || {},
        featured: product.featured,
        isPublished: product.is_published,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
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
    const adminClient = createAdminClient();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.nameEn !== undefined) updateData.name_en = body.nameEn;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.descriptionEn !== undefined) updateData.description_en = body.descriptionEn;
    if (body.price !== undefined) updateData.price = Math.round(body.price * 100);
    if (body.originalPrice !== undefined) {
      updateData.original_price = body.originalPrice ? Math.round(body.originalPrice * 100) : null;
    }
    if (body.category !== undefined) updateData.category = body.category;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.inStock !== undefined) updateData.in_stock = body.inStock;
    if (body.stockQuantity !== undefined) updateData.stock_quantity = body.stockQuantity;
    if (body.specifications !== undefined) updateData.specifications = body.specifications;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.isPublished !== undefined) updateData.is_published = body.isPublished;

    const { error } = await adminClient
      .from("products")
      .update(updateData as never)
      .eq("id", productId);

    if (error) {
      console.error("Product update error:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
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

    const { error } = await adminClient
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Product delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
