import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch all published products (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "100");

    const supabase = createAdminClient();

    let query = supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (featured === "true") {
      query = query.eq("featured", true);
    }

    query = query.limit(limit);

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
    }

    const { data: products, error } = await query as { data: ProductRow[] | null; error: unknown };

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const transformedProducts = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: p.name_en,
      slug: p.slug,
      description: p.description || "",
      descriptionEn: p.description_en,
      price: p.price / 100, // Convert from cents to euros
      originalPrice: p.original_price ? p.original_price / 100 : undefined,
      currency: p.currency,
      category: p.category,
      images: p.images || [],
      inStock: p.in_stock,
      stockQuantity: p.stock_quantity,
      specifications: p.specifications || {},
      featured: p.featured,
    }));

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new product (admin only)
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
      .single() as { data: { role: string } | null };

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      nameEn,
      slug,
      description,
      descriptionEn,
      price,
      originalPrice,
      category,
      images,
      inStock,
      stockQuantity,
      specifications,
      featured,
    } = body;

    // Validate required fields
    if (!name || !slug || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if slug is unique
    const { data: existingSlug } = await adminClient
      .from("products")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    interface ProductResult {
      id: string;
      name: string;
      slug: string;
    }

    // Insert product
    const { data: product, error } = await adminClient
      .from("products")
      .insert({
        name,
        name_en: nameEn || null,
        slug,
        description: description || null,
        description_en: descriptionEn || null,
        price: Math.round(price * 100), // Convert to cents
        original_price: originalPrice ? Math.round(originalPrice * 100) : null,
        category,
        images: images || [],
        in_stock: inStock ?? true,
        stock_quantity: stockQuantity ?? 0,
        specifications: specifications || {},
        featured: featured ?? false,
        is_published: true,
      } as never)
      .select()
      .single() as { data: ProductResult | null; error: unknown };

    if (error || !product) {
      console.error("Product creation error:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
