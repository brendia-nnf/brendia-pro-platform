import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/**
 * Generate order number in format: BW-YYMMDD-XXXX (BW = Brendia Webshop)
 * Example: BW-260708-A1B2
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  // Generate 4 random alphanumeric characters (excluding confusing chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `BW-${datePart}-${randomPart}`;
}

/** Convert euros to cents */
export function toCents(amountInEuros: number): number {
  return Math.round(amountInEuros * 100);
}

/** Convert cents to euros */
export function fromCents(amountInCents: number): number {
  return amountInCents / 100;
}

export interface WebshopCheckoutItem {
  name: string;
  optionsLabel: string | null;
  unitPrice: number; // euros
  quantity: number;
}

export interface WebshopCheckoutParams {
  orderNumber: string;
  items: WebshopCheckoutItem[];
  shipping: number; // euros
  discount: number; // euros
  customerEmail: string;
}

/**
 * Create a hosted Stripe Checkout Session for a webshop order.
 *
 * The DB order (webshop_orders) is the source of truth — the Stripe total
 * (items + shipping − discount) must always equal webshop_orders.total.
 */
export async function createWebshopCheckoutSession(
  params: WebshopCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const { orderNumber, items, shipping, discount, customerEmail } = params;

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Coupon discounts need a one-off Stripe coupon (amount in cents)
  let couponId: string | undefined;
  if (discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: toCents(discount),
      currency: "eur",
      duration: "once",
      name: "Popust",
    });
    couponId = coupon.id;
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    locale: "hr",
    customer_email: customerEmail,
    client_reference_id: orderNumber,
    metadata: {
      order_number: orderNumber,
      type: "webshop",
    },
    payment_intent_data: {
      metadata: { order_number: orderNumber },
    },
    line_items: items.map((item) => ({
      price_data: {
        currency: "eur",
        unit_amount: toCents(item.unitPrice),
        product_data: {
          name: item.optionsLabel
            ? `${item.name} (${item.optionsLabel})`
            : item.name,
        },
      },
      quantity: item.quantity,
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: toCents(shipping), currency: "eur" },
          display_name: shipping > 0 ? "Dostava" : "Besplatna dostava",
        },
      },
    ],
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    success_url: `${baseUrl}/webshop/blagajna/uspjeh?order_number=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/webshop/kosarica?order_number=${orderNumber}`,
  });
}
