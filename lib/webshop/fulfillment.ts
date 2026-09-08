import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  createFakturkoInvoice,
  isFakturkoConfigured,
  type FakturkoLine,
} from "@/lib/fakturko";

export interface StripePaymentRefs {
  sessionId: string;
  paymentIntentId?: string | null;
  customerId?: string | null;
}

export interface FulfillResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  error?: string;
}

/**
 * Mark a webshop order as paid, deduct inventory, create the Fakturko
 * invoice and email it to the customer.
 *
 * Stripe retries webhooks — the "pending" guard (early return + conditional
 * update) makes retries no-ops, so stock is never deducted twice.
 */
export async function fulfillWebshopOrder(
  orderNumber: string,
  refs: StripePaymentRefs
): Promise<FulfillResult> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("webshop_orders")
    .select(
      "id, status, customer_email, customer_name, customer_phone, items, subtotal, shipping, discount, total, shipping_full_name, shipping_street, shipping_city, shipping_postal_code, shipping_country"
    )
    .eq("order_number", orderNumber)
    .single() as {
      data: {
        id: string;
        status: string;
        customer_email: string;
        customer_name: string;
        customer_phone: string | null;
        items: unknown;
        subtotal: number;
        shipping: number;
        discount: number | null;
        total: number;
        shipping_full_name: string | null;
        shipping_street: string | null;
        shipping_city: string | null;
        shipping_postal_code: string | null;
        shipping_country: string | null;
      } | null;
    };

  if (!order) {
    console.error(`Webshop order ${orderNumber} not found`);
    return { ok: false, error: "Order not found" };
  }

  if (order.status !== "pending") {
    console.log(
      `Webshop order ${orderNumber} already processed (status: ${order.status}), skipping`
    );
    return { ok: true, alreadyProcessed: true };
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("webshop_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_session_id: refs.sessionId,
      stripe_payment_intent: refs.paymentIntentId || null,
      stripe_customer_id: refs.customerId || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id");

  if (updateError) {
    console.error("Failed to update webshop order:", updateError);
    return { ok: false, error: "Failed to update order" };
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.log(`Webshop order ${orderNumber} processed concurrently, skipping`);
    return { ok: true, alreadyProcessed: true };
  }

  console.log(`Webshop order ${orderNumber} updated to status: paid`);

  // Deduct inventory for each ordered item (per-variant when applicable)
  if (Array.isArray(order.items)) {
    for (const item of order.items as Array<{
      productId?: string;
      variantId?: string | null;
      quantity?: number;
    }>) {
      if (!item.productId || !item.quantity) continue;

      if (item.variantId) {
        const { error: stockError } = await supabase.rpc(
          "decrement_variant_stock",
          {
            p_variant_id: item.variantId,
            p_quantity: item.quantity,
          } as never
        );
        if (stockError) {
          console.error(
            `Failed to decrement stock for variant ${item.variantId}:`,
            stockError
          );
        }
        continue;
      }

      const { error: stockError } = await supabase.rpc(
        "decrement_product_stock",
        {
          p_product_id: item.productId,
          p_quantity: item.quantity,
        } as never
      );
      if (stockError) {
        // Don't fail the fulfillment over inventory bookkeeping
        console.error(
          `Failed to decrement stock for product ${item.productId}:`,
          stockError
        );
      }
    }
  }

  // Create a fiscalized invoice via Fakturko and email the PDF to the
  // customer. Failures are recorded on the order, never block fulfillment.
  if (isFakturkoConfigured()) {
    try {
      const VAT = 1.25;
      const round2 = (n: number) => Math.round(n * 100) / 100;
      const kpdProducts = process.env.FAKTURKO_KPD_CODE || "47.00";
      const kpdShipping = process.env.FAKTURKO_KPD_SHIPPING || "53.20.19";

      const items = (Array.isArray(order.items) ? order.items : []) as Array<{
        name?: string;
        price?: number; // gross, in euros
        quantity?: number;
      }>;

      const lines: FakturkoLine[] = items
        .filter((i) => i.name && i.price && i.quantity)
        .map((i) => {
          const gross = i.price! * i.quantity!;
          return {
            name: i.name!,
            kpdCode: kpdProducts,
            quantity: i.quantity!,
            unitPriceWithoutVat: round2(i.price! / VAT),
            priceWithoutVat: round2(gross / VAT),
            vatPercentage: 25,
            priceWithVat: round2(gross),
          };
        });

      const shippingGross = order.shipping / 100;
      if (shippingGross > 0) {
        lines.push({
          name: "Dostava",
          kpdCode: kpdShipping,
          quantity: 1,
          unitPriceWithoutVat: round2(shippingGross / VAT),
          priceWithoutVat: round2(shippingGross / VAT),
          vatPercentage: 25,
          priceWithVat: round2(shippingGross),
        });
      }

      const grossTotal = order.total / 100;
      const discountGross = (order.discount || 0) / 100;
      const customerFullName =
        order.shipping_full_name || order.customer_name || "";
      const [firstName, ...rest] = customerFullName.trim().split(/\s+/);

      const invoiceResult = await createFakturkoInvoice({
        client: {
          type: "privatna",
          name: firstName || customerFullName,
          surname: rest.join(" ") || undefined,
          country: order.shipping_country || "Hrvatska",
          city: order.shipping_city || undefined,
          address: order.shipping_street || undefined,
          zip: order.shipping_postal_code || undefined,
          email: order.customer_email,
          phone: order.customer_phone || undefined,
        },
        lines,
        totalWithoutVat: round2(grossTotal / VAT),
        totalWithVat: round2(grossTotal),
        fixedRabat: discountGross > 0 ? discountGross : undefined,
        extRef: orderNumber,
        note: `Webshop narudžba ${orderNumber} — plaćeno karticom putem Stripe`,
      });

      if (invoiceResult.ok) {
        await supabase
          .from("webshop_orders")
          .update({
            fakturko_invoice_id: invoiceResult.invoiceId || null,
            fakturko_pdf_url: invoiceResult.pdfLink || null,
            invoiced_at: new Date().toISOString(),
            fakturko_error: null,
          } as never)
          .eq("id", order.id);
        console.log(
          `Fakturko invoice ${invoiceResult.invoiceId} created for ${orderNumber}`
        );

        if (invoiceResult.pdfLink) {
          try {
            await sendEmail({
              to: order.customer_email,
              subject: `Račun za narudžbu ${orderNumber} - Brendia Pro®`,
              html: `
                <p>Poštovani ${customerFullName},</p>
                <p>hvala na kupnji! U privitku se nalazi poveznica na račun za Vašu narudžbu <strong>${orderNumber}</strong>.</p>
                <p><a href="${invoiceResult.pdfLink}">Preuzmite račun (PDF)</a></p>
                <p>Srdačan pozdrav,<br/>Brendia Pro&reg; tim</p>
              `,
            });
          } catch (emailError) {
            console.error("Failed to send invoice email:", emailError);
          }
        }
      } else {
        await supabase
          .from("webshop_orders")
          .update({ fakturko_error: invoiceResult.error || "unknown" } as never)
          .eq("id", order.id);
        console.error(
          `Fakturko invoice failed for ${orderNumber}:`,
          invoiceResult.error
        );
      }
    } catch (invoiceError) {
      console.error("Fakturko invoicing error:", invoiceError);
    }
  }

  // Admin notification for every paid webshop order
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      const itemLines = (Array.isArray(order.items) ? order.items : [])
        .map((i) => {
          const it = i as { name?: string; quantity?: number };
          return `<li>${it.name} × ${it.quantity}</li>`;
        })
        .join("");
      await sendEmail({
        to: adminEmail,
        subject: `Nova webshop narudžba ${orderNumber} — ${(order.total / 100).toFixed(2)} €`,
        html: `<p>Naplaćena je webshop narudžba <strong>${orderNumber}</strong>.</p><p>Kupac: ${order.customer_name} (${order.customer_email})</p><ul>${itemLines}</ul><p>Ukupno: ${(order.total / 100).toFixed(2)} € — detalji u Stripe dashboardu i admin panelu.</p>`,
      });
    } catch (adminEmailError) {
      console.error("Failed to send admin order notification:", adminEmailError);
    }
  }

  return { ok: true };
}
