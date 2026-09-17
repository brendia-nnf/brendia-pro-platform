import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  createDHLShipment,
  isDHLConfigured,
  isEUCountry,
  nextBusinessDay,
  dhlTrackingUrl,
} from "@/lib/dhl";
import { computePackageWeightKg } from "@/lib/webshop/shipping";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";

const createShipmentSchema = z.object({
  weightKg: z.number().min(0.1).max(70).optional(),
  requestPickup: z.boolean().default(false),
  // YYYY-MM-DD; default = prvi radni dan
  shippingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { error: null };
}

interface WebshopOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  customer_email: string;
  tracking_number: string | null;
  dhl_label_path: string | null;
  items: unknown;
  shipping_full_name: string;
  shipping_street: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string | null;
}

// POST — kreiraj DHL pošiljku za narudžbu: label PDF u storage,
// tracking broj na narudžbu, status -> shipped + mail i notifikacija kupcu.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    if (!isDHLConfigured()) {
      return NextResponse.json(
        { error: "DHL nije konfiguriran — dodaj DHL_* env varijable" },
        { status: 503 }
      );
    }

    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const validation = createShipmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    const { weightKg, requestPickup, shippingDate } = validation.data;

    const adminClient = createAdminClient();
    const { data: order } = await adminClient
      .from("webshop_orders")
      .select(
        "id, order_number, user_id, status, customer_email, tracking_number, dhl_label_path, items, shipping_full_name, shipping_street, shipping_city, shipping_postal_code, shipping_country, shipping_phone"
      )
      .eq("id", orderId)
      .single() as { data: WebshopOrderRow | null };

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.tracking_number) {
      return NextResponse.json(
        { error: `Pošiljka već postoji (${order.tracking_number})` },
        { status: 409 }
      );
    }
    if (!["paid", "processing"].includes(order.status)) {
      return NextResponse.json(
        { error: `Narudžba je u statusu "${order.status}" — pošiljka se kreira za plaćene narudžbe` },
        { status: 400 }
      );
    }
    if (!isEUCountry(order.shipping_country)) {
      return NextResponse.json(
        {
          error: `${order.shipping_country} nije EU destinacija — DHL traži carinsku dokumentaciju. Kreiraj pošiljku ručno u MyDHL sučelju i upiši tracking broj.`,
        },
        { status: 400 }
      );
    }

    const items = (Array.isArray(order.items) ? order.items : []) as Array<{
      productId?: string;
      variantId?: string | null;
      quantity?: number;
    }>;
    const weight =
      weightKg ||
      (await computePackageWeightKg(
        items
          .filter((i) => i.productId && i.quantity)
          .map((i) => ({
            productId: i.productId!,
            variantId: i.variantId,
            quantity: i.quantity!,
          }))
      ));

    const result = await createDHLShipment({
      receiver: {
        fullName: order.shipping_full_name,
        street: order.shipping_street,
        city: order.shipping_city,
        postalCode: order.shipping_postal_code,
        countryCode: order.shipping_country,
        phone: order.shipping_phone,
        email: order.customer_email,
      },
      weightKg: weight,
      orderNumber: order.order_number,
      description: "Hair extensions and accessories",
      shippingDate: shippingDate || nextBusinessDay(),
      requestPickup,
    });

    if (!result.ok || !result.trackingNumber) {
      await adminClient
        .from("webshop_orders")
        .update({ dhl_error: result.error || "unknown" } as never)
        .eq("id", order.id);
      return NextResponse.json(
        { error: `DHL greška: ${result.error || "nepoznata"}` },
        { status: 502 }
      );
    }

    // Spremi naljepnicu u privatni bucket; neuspjeh ne ruši pošiljku
    let labelPath: string | null = null;
    if (result.labelPdfBase64) {
      labelPath = `${order.order_number}/${result.trackingNumber}.pdf`;
      const { error: uploadError } = await adminClient.storage
        .from("shipping-labels")
        .upload(labelPath, Buffer.from(result.labelPdfBase64, "base64"), {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) {
        console.error("Label upload failed:", uploadError);
        labelPath = null;
      }
    }

    await adminClient
      .from("webshop_orders")
      .update({
        tracking_number: result.trackingNumber,
        status: "shipped",
        shipped_at: new Date().toISOString(),
        dhl_label_path: labelPath,
        dhl_pickup_confirmation: result.pickupConfirmation || null,
        dhl_shipment_created_at: new Date().toISOString(),
        dhl_error: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", order.id);

    const trackingUrl = dhlTrackingUrl(result.trackingNumber);

    if (order.user_id) {
      await createNotification({
        userId: order.user_id,
        type: "order",
        title: `Narudžba ${order.order_number} je poslana`,
        body: `Broj za praćenje: ${result.trackingNumber}`,
        link: "/narudzbe",
      });
    }

    try {
      await sendEmail({
        to: order.customer_email,
        subject: `Vaša narudžba ${order.order_number} je poslana - Brendia Pro®`,
        html: `
          <p>Poštovani ${order.shipping_full_name},</p>
          <p>Vaša narudžba <strong>${order.order_number}</strong> je predana DHL-u i uskoro stiže na Vašu adresu.</p>
          <p>Broj za praćenje: <strong>${result.trackingNumber}</strong></p>
          <p><a href="${trackingUrl}">Pratite pošiljku ovdje</a></p>
          <p>Srdačan pozdrav,<br/>Brendia Pro&reg; tim</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send shipping email:", emailError);
    }

    return NextResponse.json({
      success: true,
      trackingNumber: result.trackingNumber,
      trackingUrl,
      labelPath,
      pickupConfirmation: result.pickupConfirmation || null,
      weightKg: weight,
    });
  } catch (error) {
    console.error("DHL shipment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — signed URL za download PDF naljepnice (vrijedi 1 sat)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) return authError;

    const { id: orderId } = await params;
    const adminClient = createAdminClient();
    const { data: order } = await adminClient
      .from("webshop_orders")
      .select("dhl_label_path")
      .eq("id", orderId)
      .single() as { data: { dhl_label_path: string | null } | null };

    if (!order?.dhl_label_path) {
      return NextResponse.json({ error: "Naljepnica ne postoji" }, { status: 404 });
    }

    const { data, error } = await adminClient.storage
      .from("shipping-labels")
      .createSignedUrl(order.dhl_label_path, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Greška pri dohvatu naljepnice" }, { status: 500 });
    }
    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error("DHL label error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
