import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types/webshop";
import { SHIPPING_THRESHOLD, SHIPPING_COST, variantLabel } from "@/lib/types/webshop";
import {
  MONRI_CONFIG,
  generateOrderNumber,
  buildMonriFormData,
  formatAmountForMonri,
} from "@/lib/monri/config";

interface CheckoutRequest {
  items: CartItem[];
  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  // Shipping address
  shippingFullName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone?: string;
  // Optional
  couponCode?: string;
  customerNotes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      shippingFullName,
      shippingStreet,
      shippingCity,
      shippingPostalCode,
      shippingCountry,
      shippingPhone,
      couponCode,
      customerNotes,
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Košarica je prazna" },
        { status: 400 }
      );
    }

    if (!customerName || !customerEmail || !shippingStreet || !shippingCity || !shippingPostalCode || !shippingCountry) {
      return NextResponse.json(
        { error: "Svi obvezni podaci moraju biti ispunjeni" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Link the order to the logged-in student when there is a session
    // (the webshop lives inside the dashboard, so this is the normal case)
    let userId: string | null = null;
    try {
      const authClient = await createServerSupabaseClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Guest checkout stays possible
    }

    // Validate stock and resolve authoritative prices from the database
    // (never trust prices sent by the client)
    const productIds = items.map((item) => item.product.id);
    const { data: stockRows } = await supabase
      .from("products")
      .select("id, name, price, in_stock, stock_quantity, track_inventory, has_variants")
      .in("id", productIds) as {
        data: Array<{
          id: string;
          name: string;
          price: number;
          in_stock: boolean;
          stock_quantity: number;
          track_inventory: boolean;
          has_variants: boolean;
        }> | null;
      };

    const variantIds = items
      .map((item) => item.variant?.id)
      .filter((id): id is string => !!id);
    const { data: variantRows } = variantIds.length
      ? ((await supabase
          .from("product_variants")
          .select("id, product_id, length_cm, weight_g, texture, price, stock_quantity, in_stock")
          .in("id", variantIds)) as {
          data: Array<{
            id: string;
            product_id: string;
            length_cm: number | null;
            weight_g: number | null;
            texture: string | null;
            price: number;
            stock_quantity: number;
            in_stock: boolean;
          }> | null;
        })
      : { data: [] };

    // Per-line resolved data: unit price in euros + display label
    const resolvedItems: Array<{
      productId: string;
      variantId: string | null;
      name: string;
      optionsLabel: string | null;
      unitPrice: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const product = stockRows?.find((p) => p.id === item.product.id);
      if (!product) {
        return NextResponse.json(
          { error: `Proizvod "${item.product.name}" više nije dostupan` },
          { status: 400 }
        );
      }

      if (product.has_variants) {
        const variant = (variantRows || []).find(
          (v) => v.id === item.variant?.id && v.product_id === product.id
        );
        if (!variant) {
          return NextResponse.json(
            { error: `Odabrana kombinacija proizvoda "${product.name}" više nije dostupna` },
            { status: 400 }
          );
        }
        const label = variantLabel({
          lengthCm: variant.length_cm,
          weightG: variant.weight_g,
          texture: variant.texture as "straight" | "wavy" | "curly" | null,
        });
        if (!variant.in_stock || variant.stock_quantity < item.quantity) {
          return NextResponse.json(
            {
              error: variant.stock_quantity > 0
                ? `Proizvod "${product.name}" (${label}) — na skladištu je još ${variant.stock_quantity} kom`
                : `Proizvod "${product.name}" (${label}) nema na skladištu`,
            },
            { status: 400 }
          );
        }
        resolvedItems.push({
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          optionsLabel: label,
          unitPrice: variant.price / 100,
          quantity: item.quantity,
        });
      } else {
        if (
          !product.in_stock ||
          (product.track_inventory && product.stock_quantity < item.quantity)
        ) {
          return NextResponse.json(
            {
              error: product.track_inventory && product.stock_quantity > 0
                ? `Proizvod "${product.name}" — na skladištu je još ${product.stock_quantity} kom`
                : `Proizvod "${product.name}" nema na skladištu`,
            },
            { status: 400 }
          );
        }
        resolvedItems.push({
          productId: product.id,
          variantId: null,
          name: product.name,
          optionsLabel: null,
          unitPrice: product.price / 100,
          quantity: item.quantity,
        });
      }
    }

    // Calculate subtotal in euros from DB-resolved prices
    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Calculate shipping (free over threshold)
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // Validate and apply coupon if provided
    let discount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const { data: couponResult, error: couponError } = await supabase
        .rpc("validate_coupon", {
          p_code: couponCode.toUpperCase(),
          p_order_subtotal: formatAmountForMonri(subtotal),
          p_user_id: userId,
        } as never) as { data: Array<{ valid: boolean; discount_amount: number; coupon_id: string }> | null; error: unknown };

      if (couponError) {
        console.error("Coupon validation error:", couponError);
      } else if (couponResult && couponResult[0]?.valid) {
        discount = couponResult[0].discount_amount / 100; // Convert from cents to euros
        couponId = couponResult[0].coupon_id;
      }
    }

    // Calculate total
    const total = subtotal + shipping - discount;

    // Generate unique order number
    let orderNumber = generateOrderNumber();

    // Ensure order number is unique
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("webshop_orders")
        .select("id")
        .eq("order_number", orderNumber)
        .single();

      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    // Prepare items JSON for storage (options baked into the name so every
    // existing order view shows the chosen combination)
    const itemsJson = resolvedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.optionsLabel ? `${item.name} (${item.optionsLabel})` : item.name,
      options: item.optionsLabel,
      price: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.unitPrice * item.quantity,
    }));

    // Create order in database with pending status
    const { error: dbError } = await supabase.from("webshop_orders").insert({
      order_number: orderNumber,
      user_id: userId,
      // Customer details
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      // Shipping address
      shipping_full_name: shippingFullName,
      shipping_street: shippingStreet,
      shipping_city: shippingCity,
      shipping_postal_code: shippingPostalCode,
      shipping_country: shippingCountry,
      shipping_phone: shippingPhone || null,
      // Order items
      items: itemsJson,
      // Pricing (store in cents)
      subtotal: formatAmountForMonri(subtotal),
      shipping: formatAmountForMonri(shipping),
      discount: formatAmountForMonri(discount),
      total: formatAmountForMonri(total),
      currency: "eur",
      // Coupon
      coupon_code: couponCode || null,
      coupon_id: couponId,
      // Status
      status: "pending",
      // Notes
      customer_notes: customerNotes || null,
    } as never);

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Greška pri kreiranju narudžbe" },
        { status: 500 }
      );
    }

    // Build Monri form data
    // Generate order info string
    const itemNames = itemsJson.map((item) => `${item.name} x${item.quantity}`).join(", ");
    const orderInfo = itemNames.length > 100
      ? itemNames.substring(0, 97) + "..."
      : itemNames;

    const monriFormData = buildMonriFormData({
      orderNumber,
      amount: formatAmountForMonri(total), // Total in cents
      currency: "EUR",
      customerName: shippingFullName,
      email: customerEmail,
      phone: customerPhone || shippingPhone || "",
      address: shippingStreet,
      city: shippingCity,
      postalCode: shippingPostalCode,
      country: shippingCountry,
      orderInfo: `Brendia Pro Webshop - ${orderInfo}`,
      customData: JSON.stringify({
        type: "webshop",
        itemCount: items.length,
        couponCode: couponCode || null,
      }),
      language: "hr",
      successPath: "/webshop/blagajna/uspjeh",
      cancelPath: "/webshop/kosarica",
    });

    return NextResponse.json({
      formUrl: MONRI_CONFIG.formUrl,
      formData: monriFormData,
      orderNumber,
      pricing: {
        subtotal,
        shipping,
        discount,
        total,
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Došlo je do greške pri kreiranju narudžbe" },
      { status: 500 }
    );
  }
}
