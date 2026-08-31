import type { createAdminClient } from "@/lib/supabase/server";

export interface VariantPayload {
  id?: string;
  lengthCm: number | null;
  weightG: number | null;
  texture: string | null;
  price: number; // in euros from the admin form
  stockQuantity: number;
  inStock?: boolean;
}

const VALID_TEXTURES = ["straight", "wavy", "curly"];

export function validateVariants(variants: unknown): string | null {
  if (!Array.isArray(variants)) return "Variants must be an array";
  for (const v of variants as VariantPayload[]) {
    if (v.price === undefined || v.price === null || Number(v.price) < 0) {
      return "Svaka varijanta mora imati cijenu";
    }
    if (v.texture && !VALID_TEXTURES.includes(v.texture)) {
      return `Nepoznata tekstura: ${v.texture}`;
    }
    if (!v.lengthCm && !v.weightG && !v.texture) {
      return "Varijanta mora imati barem jednu opciju (duljina, gramaža ili tekstura)";
    }
  }
  return null;
}

// Replaces the product's variants with the submitted set: updates rows that
// still exist, inserts new combinations, deletes removed ones.
export async function syncProductVariants(
  adminClient: ReturnType<typeof createAdminClient>,
  productId: string,
  variants: VariantPayload[]
): Promise<{ error: string | null }> {
  const { data: existing } = (await adminClient
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)) as { data: Array<{ id: string }> | null };

  const existingIds = new Set((existing || []).map((r) => r.id));
  const keptIds = new Set(
    variants.map((v) => v.id).filter((id): id is string => !!id && existingIds.has(id))
  );

  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    const { error } = await adminClient
      .from("product_variants")
      .delete()
      .in("id", toDelete);
    if (error) return { error: "Failed to delete removed variants" };
  }

  for (const v of variants) {
    const row = {
      product_id: productId,
      length_cm: v.lengthCm || null,
      weight_g: v.weightG || null,
      texture: v.texture || null,
      price: Math.round(Number(v.price) * 100),
      stock_quantity: Number(v.stockQuantity) || 0,
      in_stock: v.inStock ?? (Number(v.stockQuantity) || 0) > 0,
      updated_at: new Date().toISOString(),
    };

    if (v.id && keptIds.has(v.id)) {
      const { error } = await adminClient
        .from("product_variants")
        .update(row as never)
        .eq("id", v.id);
      if (error) return { error: "Failed to update variant" };
    } else {
      const { error } = await adminClient
        .from("product_variants")
        .insert(row as never);
      if (error) return { error: "Failed to insert variant" };
    }
  }

  return { error: null };
}
