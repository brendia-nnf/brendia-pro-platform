// Izračun cijene dostave za webshop — jedna funkcija koju dijele
// checkout quote endpoint i create-checkout, pa je prikazana cijena
// uvijek jednaka naplaćenoj.
//
// Pravila: besplatna dostava iznad SHIPPING_THRESHOLD; ispod toga živa
// DHL cijena (account rate + opcionalna marža), a ako DHL nije
// konfiguriran ili ne odgovori — dosadašnja fiksna cijena.

import { createAdminClient } from "@/lib/supabase/server";
import { SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/types/webshop";
import { getDHLRate, isDHLConfigured } from "@/lib/dhl";

export interface ShippingQuoteItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface ShippingQuote {
  shipping: number; // EUR
  weightKg: number;
  source: "free" | "dhl" | "flat";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Težina paketa iz DB podataka o proizvodima + ambalaža. */
export async function computePackageWeightKg(
  items: ShippingQuoteItem[]
): Promise<number> {
  const supabase = createAdminClient();
  const defaultItemG = Number(process.env.DHL_DEFAULT_ITEM_WEIGHT_G || 500);
  const packagingG = Number(process.env.DHL_PACKAGING_WEIGHT_G || 250);

  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items
    .map((i) => i.variantId)
    .filter((id): id is string => !!id);

  const { data: products } = await supabase
    .from("products")
    .select("id, weight_grams")
    .in("id", productIds) as {
      data: Array<{ id: string; weight_grams: number | null }> | null;
    };

  const { data: variants } = variantIds.length
    ? ((await supabase
        .from("product_variants")
        .select("id, weight_g")
        .in("id", variantIds)) as {
        data: Array<{ id: string; weight_g: number | null }> | null;
      })
    : { data: [] };

  let grams = packagingG;
  for (const item of items) {
    const variantG = item.variantId
      ? variants?.find((v) => v.id === item.variantId)?.weight_g
      : null;
    const productG = products?.find((p) => p.id === item.productId)?.weight_grams;
    grams += (variantG || productG || defaultItemG) * item.quantity;
  }
  return Math.max(grams / 1000, 0.5);
}

/**
 * Cijena dostave za dani sadržaj košarice i destinaciju.
 * subtotal je u eurima (već razriješen iz DB cijena).
 */
export async function getShippingQuote(params: {
  items: ShippingQuoteItem[];
  subtotal: number;
  city: string;
  postalCode: string;
  countryCode: string;
}): Promise<ShippingQuote> {
  const weightKg = await computePackageWeightKg(params.items);

  if (params.subtotal >= SHIPPING_THRESHOLD) {
    return { shipping: 0, weightKg, source: "free" };
  }

  if (isDHLConfigured()) {
    const rate = await getDHLRate({
      destination: {
        city: params.city,
        postalCode: params.postalCode,
        countryCode: params.countryCode,
      },
      weightKg,
    });
    if (rate.ok && rate.price) {
      const markupPct = Number(process.env.DHL_RATE_MARKUP_PCT || 0);
      return {
        shipping: round2(rate.price * (1 + markupPct / 100)),
        weightKg,
        source: "dhl",
      };
    }
    console.error("DHL rate failed, falling back to flat rate:", rate.error);
  }

  return { shipping: SHIPPING_COST, weightKg, source: "flat" };
}
