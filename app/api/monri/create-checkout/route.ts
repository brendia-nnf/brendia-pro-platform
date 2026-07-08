// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types/webshop";
import { SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/types/webshop";
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

    // Calculate subtotal (items are already in euros from frontend)
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
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
          p_user_id: null, // Guest checkout
        });

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

    // Prepare items JSON for storage
    const itemsJson = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    // Create order in database with pending status
    const { error: dbError } = await supabase.from("webshop_orders").insert({
      order_number: orderNumber,
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
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Greška pri kreiranju narudžbe" },
        { status: 500 }
      );
    }

    // Build Monri form data
    // Generate order info string
    const itemNames = items.map((item) => `${item.product.name} x${item.quantity}`).join(", ");
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
