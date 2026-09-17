import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getShippingQuote, type ShippingQuoteItem } from "@/lib/webshop/shipping";
import { z } from "zod";

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullish(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(2).max(20),
  country: z.string().length(2),
});

// POST — živa cijena dostave za košaricu i adresu (prije plaćanja).
// Subtotal se računa iz DB cijena, nikad iz klijentovih brojeva.
export async function POST(request: NextRequest) {
  try {
    const validation = quoteSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: "Neispravan zahtjev" }, { status: 400 });
    }
    const { items, city, postalCode, country } = validation.data;

    const supabase = createAdminClient();
    const productIds = [...new Set(items.map((i) => i.productId))];
    const variantIds = items
      .map((i) => i.variantId)
      .filter((id): id is string => !!id);

    const { data: products } = await supabase
      .from("products")
      .select("id, price, has_variants")
      .in("id", productIds) as {
        data: Array<{ id: string; price: number; has_variants: boolean }> | null;
      };

    const { data: variants } = variantIds.length
      ? ((await supabase
          .from("product_variants")
          .select("id, price")
          .in("id", variantIds)) as {
          data: Array<{ id: string; price: number }> | null;
        })
      : { data: [] };

    let subtotal = 0;
    for (const item of items) {
      const product = products?.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 400 });
      }
      const unitCents = item.variantId
        ? variants?.find((v) => v.id === item.variantId)?.price
        : product.price;
      if (typeof unitCents !== "number") {
        return NextResponse.json({ error: "Varijanta nije pronađena" }, { status: 400 });
      }
      subtotal += (unitCents / 100) * item.quantity;
    }

    const quote = await getShippingQuote({
      items: items as ShippingQuoteItem[],
      subtotal,
      city,
      postalCode,
      countryCode: country,
    });

    return NextResponse.json({
      shipping: quote.shipping,
      source: quote.source,
    });
  } catch (error) {
    console.error("Shipping quote error:", error);
    return NextResponse.json(
      { error: "Greška pri izračunu dostave" },
      { status: 500 }
    );
  }
}
