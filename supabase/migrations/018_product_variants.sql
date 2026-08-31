-- Product variants (hair: length / pack weight / texture) + product weight for shipping
-- Price and stock are tracked per combination (admin decision 2026-08-31).

-- 1) Product-level additions
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER,
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.weight_grams IS 'Shipping weight of one unit in grams (future shipping calculations)';
COMMENT ON COLUMN public.products.has_variants IS 'When true, price/stock come from product_variants and the customer must pick a combination';

-- 2) Variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Option dimensions; NULL means the dimension does not apply to this product
  length_cm INTEGER,
  weight_g INTEGER,
  texture TEXT CHECK (texture IN ('straight', 'wavy', 'curly')),

  -- Pricing (in cents) and per-combination inventory
  price INTEGER NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per combination (NULL-safe uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_combination_key
  ON public.product_variants (
    product_id,
    COALESCE(length_cm, 0),
    COALESCE(weight_g, 0),
    COALESCE(texture, '')
  );

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON public.product_variants (product_id);

-- 3) RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variants of published products" ON public.product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.is_published = true
    )
  );

CREATE POLICY "Admins can manage variants" ON public.product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage variants" ON public.product_variants
  FOR ALL USING (auth.role() = 'service_role');

-- 4) Variant stock decrement (mirrors decrement_product_stock) and keeps the
--    parent product's in_stock flag in sync with its variants
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_product_id UUID;
BEGIN
  UPDATE public.product_variants
  SET
    stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
    in_stock = CASE
      WHEN stock_quantity - p_quantity <= 0 THEN false
      ELSE in_stock
    END,
    updated_at = NOW()
  WHERE id = p_variant_id
  RETURNING product_id INTO v_product_id;

  IF v_product_id IS NOT NULL THEN
    UPDATE public.products
    SET in_stock = EXISTS (
      SELECT 1 FROM public.product_variants
      WHERE product_id = v_product_id
        AND in_stock = true
        AND stock_quantity > 0
    )
    WHERE id = v_product_id
      AND has_variants = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
