-- Create webshop products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Product Details
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_en TEXT,

  -- Pricing (in cents)
  price INTEGER NOT NULL,
  original_price INTEGER, -- For sale items
  currency TEXT DEFAULT 'eur',

  -- Category
  category TEXT NOT NULL CHECK (category IN ('extensions', 'tools', 'care')),

  -- Images (array of URLs)
  images TEXT[] DEFAULT '{}',

  -- Inventory
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,

  -- Specifications (JSON)
  specifications JSONB DEFAULT '{}',

  -- Display
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,

  -- Stripe
  stripe_product_id TEXT,
  stripe_price_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webshop orders table
CREATE TABLE public.webshop_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Order Reference
  order_number TEXT UNIQUE NOT NULL,

  -- Customer (can be guest or registered)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Shipping Address
  shipping_full_name TEXT NOT NULL,
  shipping_street TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_phone TEXT,

  -- Order Items (stored as JSON for history)
  items JSONB NOT NULL DEFAULT '[]',

  -- Pricing (in cents)
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',

  -- Coupon
  coupon_code TEXT,
  coupon_id UUID,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Order created, awaiting payment
    'paid',       -- Payment received
    'processing', -- Being prepared
    'shipped',    -- Sent out
    'delivered',  -- Confirmed delivered
    'cancelled',  -- Cancelled
    'refunded'    -- Refunded
  )),

  -- Stripe
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  stripe_customer_id TEXT,

  -- Shipping Info
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Coupon Details
  code TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL, -- Percentage (1-100) or cents

  -- Restrictions
  minimum_order INTEGER, -- Minimum order in cents
  maximum_discount INTEGER, -- Max discount for percentage type

  -- Usage
  usage_limit INTEGER, -- NULL for unlimited
  usage_count INTEGER DEFAULT 0,
  one_per_customer BOOLEAN DEFAULT true,

  -- Validity
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX idx_products_is_published ON public.products(is_published);

CREATE INDEX idx_webshop_orders_user_id ON public.webshop_orders(user_id);
CREATE INDEX idx_webshop_orders_order_number ON public.webshop_orders(order_number);
CREATE INDEX idx_webshop_orders_status ON public.webshop_orders(status);
CREATE INDEX idx_webshop_orders_customer_email ON public.webshop_orders(customer_email);
CREATE INDEX idx_webshop_orders_created_at ON public.webshop_orders(created_at DESC);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webshop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "Anyone can view published products" ON public.products
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage products" ON public.products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Orders Policies
CREATE POLICY "Users can view own orders" ON public.webshop_orders
  FOR SELECT
  USING (auth.uid() = user_id OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all orders" ON public.webshop_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders" ON public.webshop_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage orders" ON public.webshop_orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Coupons Policies
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage coupons" ON public.coupons
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update timestamp triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webshop_orders_updated_at
  BEFORE UPDATE ON public.webshop_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
  result TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYMMDD');
  SELECT LPAD((COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(order_number, '^BP-' || date_part || '-', ''), '')::INTEGER
  ), 0) + 1)::TEXT, 4, '0')
  INTO seq_part
  FROM public.webshop_orders
  WHERE order_number LIKE 'BP-' || date_part || '-%';

  result := 'BP-' || date_part || '-' || seq_part;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_order_subtotal INTEGER,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  valid BOOLEAN,
  error_message TEXT,
  discount_amount INTEGER,
  coupon_id UUID
) AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage INTEGER;
  v_discount INTEGER;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Coupon not found'::TEXT, 0, NULL::UUID;
    RETURN;
  END IF;

  -- Check if expired
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Coupon has expired'::TEXT, 0, NULL::UUID;
    RETURN;
  END IF;

  -- Check if not yet valid
  IF v_coupon.starts_at > NOW() THEN
    RETURN QUERY SELECT false, 'Coupon is not yet valid'::TEXT, 0, NULL::UUID;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, 'Coupon usage limit reached'::TEXT, 0, NULL::UUID;
    RETURN;
  END IF;

  -- Check minimum order
  IF v_coupon.minimum_order IS NOT NULL AND p_order_subtotal < v_coupon.minimum_order THEN
    RETURN QUERY SELECT false,
      ('Minimum order of ' || (v_coupon.minimum_order / 100.0)::TEXT || ' EUR required')::TEXT,
      0, NULL::UUID;
    RETURN;
  END IF;

  -- Check one per customer
  IF v_coupon.one_per_customer AND p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage
    FROM public.webshop_orders
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

    IF v_user_usage > 0 THEN
      RETURN QUERY SELECT false, 'Coupon already used'::TEXT, 0, NULL::UUID;
      RETURN;
    END IF;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_order_subtotal * v_coupon.discount_value / 100);
    IF v_coupon.maximum_discount IS NOT NULL AND v_discount > v_coupon.maximum_discount THEN
      v_discount := v_coupon.maximum_discount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  -- Ensure discount doesn't exceed order total
  IF v_discount > p_order_subtotal THEN
    v_discount := p_order_subtotal;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, v_discount, v_coupon.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample products
INSERT INTO public.products (name, name_en, slug, description, description_en, price, category, images, in_stock, stock_quantity, featured) VALUES
('Brendia Pro Weft Set', 'Brendia Pro Weft Set', 'brendia-pro-weft-set', 'Premium set weft ekstenzija za profesionalnu primjenu.', 'Premium weft extensions set for professional use.', 29900, 'extensions', ARRAY['https://placeholder.com/weft-set.jpg'], true, 50, true),
('Profesionalne igle', 'Professional Needles', 'professional-needles', 'Set profesionalnih igala za weft tehniku.', 'Set of professional needles for weft technique.', 1990, 'tools', ARRAY['https://placeholder.com/needles.jpg'], true, 100, false),
('Brendia Care Serum', 'Brendia Care Serum', 'brendia-care-serum', 'Serum za njegu ekstenzija i prirodne kose.', 'Serum for extensions and natural hair care.', 2490, 'care', ARRAY['https://placeholder.com/serum.jpg'], true, 75, true);

-- Insert sample coupon
INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order, is_active) VALUES
('WELCOME10', 'Dobrodosli popust 10%', 'percentage', 10, 5000, true);
