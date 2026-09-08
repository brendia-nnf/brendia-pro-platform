-- Color as a fourth variant dimension + optional per-variant swatch/image.
-- color_hex renders as a swatch circle; image_url (optional) swaps the product
-- gallery when the customer picks that color. Both are repeated on every
-- combination row of the same color (admin form fills them per color).

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS color_hex TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.product_variants.color IS 'Color name shown to the customer (e.g. "Natural Black", "Blonde 613"); NULL when the product has no color options';
COMMENT ON COLUMN public.product_variants.color_hex IS 'Hex code (#rrggbb) for the swatch button; optional';
COMMENT ON COLUMN public.product_variants.image_url IS 'Variant image shown in the gallery when this color is selected; optional';

-- Rebuild combination uniqueness to include color
DROP INDEX IF EXISTS product_variants_combination_key;
CREATE UNIQUE INDEX product_variants_combination_key
  ON public.product_variants (
    product_id,
    COALESCE(length_cm, 0),
    COALESCE(weight_g, 0),
    COALESCE(texture, ''),
    COALESCE(color, '')
  );
