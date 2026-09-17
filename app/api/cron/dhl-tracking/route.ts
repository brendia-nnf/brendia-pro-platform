import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getDHLTracking, isDHLConfigured } from "@/lib/dhl";
import { createNotification } from "@/lib/notifications";

// Vercel cron (vidi vercel.json): prati poslane pošiljke i kad DHL javi
// isporuku prebacuje narudžbu u "delivered" + notificira kupca.
// Vercel šalje Authorization: Bearer ${CRON_SECRET} automatski.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDHLConfigured()) {
    return NextResponse.json({ ok: true, skipped: "DHL not configured" });
  }

  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("webshop_orders")
    .select("id, order_number, user_id, tracking_number")
    .eq("status", "shipped")
    .not("tracking_number", "is", null)
    .limit(50) as {
      data: Array<{
        id: string;
        order_number: string;
        user_id: string | null;
        tracking_number: string;
      }> | null;
    };

  let delivered = 0;
  const checked = orders?.length || 0;

  for (const order of orders || []) {
    const tracking = await getDHLTracking(order.tracking_number);
    if (!tracking.ok) {
      console.error(
        `DHL tracking failed for ${order.order_number} (${order.tracking_number}):`,
        tracking.error
      );
      continue;
    }
    if (!tracking.delivered) continue;

    await supabase
      .from("webshop_orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", order.id)
      .eq("status", "shipped");

    if (order.user_id) {
      await createNotification({
        userId: order.user_id,
        type: "order",
        title: `Narudžba ${order.order_number} je dostavljena`,
        link: "/narudzbe",
      });
    }
    delivered++;
  }

  return NextResponse.json({ ok: true, checked, delivered });
}
