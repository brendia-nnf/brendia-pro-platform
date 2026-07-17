-- =====================================================
-- ATOMIC STOCK DECREMENT FOR PAID WEBSHOP ORDERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET
    stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
    in_stock = CASE
      WHEN stock_quantity - p_quantity <= 0 THEN false
      ELSE in_stock
    END
  WHERE id = p_product_id
    AND track_inventory = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
