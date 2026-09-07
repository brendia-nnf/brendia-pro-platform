import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/server";
import { fulfillWebshopOrder } from "@/lib/webshop/fulfillment";

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  // Signature verification needs the exact raw body — never parse JSON first
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature || "",
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number;

        if (session.metadata?.type !== "webshop" || !orderNumber) {
          console.log("checkout.session.completed without webshop metadata - ignoring");
          break;
        }
        if (session.payment_status !== "paid") {
          console.log(`Session for ${orderNumber} not paid yet - ignoring`);
          break;
        }

        const result = await fulfillWebshopOrder(orderNumber, {
          sessionId: session.id,
          paymentIntentId: idOf(session.payment_intent),
          customerId: idOf(session.customer as string | { id: string } | null),
        });

        if (!result.ok) {
          throw new Error(result.error || "Fulfillment failed");
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number;
        if (session.metadata?.type !== "webshop" || !orderNumber) break;

        const supabase = createAdminClient();
        await supabase
          .from("webshop_orders")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          } as never)
          .eq("order_number", orderNumber)
          .eq("status", "pending");

        console.log(`Webshop order ${orderNumber} cancelled (checkout expired)`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Stripe webhook handler error for ${event.type}:`, err);
    // 500 → Stripe retries; handlers are idempotent so retries are safe
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
