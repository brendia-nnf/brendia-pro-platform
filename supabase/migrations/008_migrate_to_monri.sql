-- Migration from Stripe to Monri payment gateway
-- This migration adds Monri-specific columns to enrollments and webshop_orders tables

-- ==========================================
-- ENROLLMENTS TABLE
-- ==========================================

-- Add Monri columns to enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(40) UNIQUE,
  ADD COLUMN IF NOT EXISTS monri_transaction_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS monri_approval_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS monri_response_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS monri_pan_token VARCHAR(100),
  ADD COLUMN IF NOT EXISTS monri_masked_pan VARCHAR(20);

-- Create indexes for Monri lookups on enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_order_number ON public.enrollments(order_number);
CREATE INDEX IF NOT EXISTS idx_enrollments_monri_transaction ON public.enrollments(monri_transaction_id);

-- Add comments for documentation
COMMENT ON COLUMN public.enrollments.order_number IS 'Unique order number for Monri integration (format: BP-YYMMDD-XXXX)';
COMMENT ON COLUMN public.enrollments.monri_transaction_id IS 'Monri transaction ID returned after successful payment';
COMMENT ON COLUMN public.enrollments.monri_approval_code IS 'Bank approval code from Monri';
COMMENT ON COLUMN public.enrollments.monri_response_code IS 'Monri response code (0000 = approved)';
COMMENT ON COLUMN public.enrollments.monri_pan_token IS 'Tokenized card PAN for future payments (optional)';
COMMENT ON COLUMN public.enrollments.monri_masked_pan IS 'Masked card number (e.g., 411111******1111)';

-- ==========================================
-- WEBSHOP ORDERS TABLE
-- ==========================================

-- Add Monri columns to webshop_orders (order_number already exists)
ALTER TABLE public.webshop_orders
  ADD COLUMN IF NOT EXISTS monri_transaction_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS monri_approval_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS monri_response_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS monri_pan_token VARCHAR(100),
  ADD COLUMN IF NOT EXISTS monri_masked_pan VARCHAR(20);

-- Create index for Monri transaction lookups
CREATE INDEX IF NOT EXISTS idx_webshop_orders_monri_transaction ON public.webshop_orders(monri_transaction_id);

-- Add comments for documentation
COMMENT ON COLUMN public.webshop_orders.monri_transaction_id IS 'Monri transaction ID returned after successful payment';
COMMENT ON COLUMN public.webshop_orders.monri_approval_code IS 'Bank approval code from Monri';
COMMENT ON COLUMN public.webshop_orders.monri_response_code IS 'Monri response code (0000 = approved)';
COMMENT ON COLUMN public.webshop_orders.monri_pan_token IS 'Tokenized card PAN for future payments (optional)';
COMMENT ON COLUMN public.webshop_orders.monri_masked_pan IS 'Masked card number (e.g., 411111******1111)';

-- ==========================================
-- PRODUCTS TABLE - Remove Stripe columns (optional, safe to keep)
-- ==========================================

-- Note: Keeping stripe_product_id and stripe_price_id columns for now
-- They can be removed in a future migration once Monri is fully operational
-- Products don't need Monri-specific columns as pricing is handled at order level

-- ==========================================
-- HELPER FUNCTION FOR ENROLLMENT ORDER NUMBERS
-- ==========================================

-- Function to generate order number for enrollments
CREATE OR REPLACE FUNCTION public.generate_enrollment_order_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
  result TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INTEGER;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYMMDD');
  random_part := '';

  -- Generate 4 random alphanumeric characters
  FOR i IN 1..4 LOOP
    random_part := random_part || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;

  result := 'BP-' || date_part || '-' || random_part;

  -- Check uniqueness across both tables
  WHILE EXISTS (
    SELECT 1 FROM public.enrollments WHERE order_number = result
    UNION
    SELECT 1 FROM public.webshop_orders WHERE order_number = result
  ) LOOP
    random_part := '';
    FOR i IN 1..4 LOOP
      random_part := random_part || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
    END LOOP;
    result := 'BP-' || date_part || '-' || random_part;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
