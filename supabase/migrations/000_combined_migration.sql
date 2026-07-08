-- =====================================================
-- BRENDIA PRO PLATFORM - COMPLETE DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. ENROLLMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id TEXT NOT NULL,
  package TEXT NOT NULL CHECK (package IN ('basic', 'advanced')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'refunded')),
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  stripe_payment_intent TEXT,
  stripe_customer_id TEXT,
  stripe_session_id TEXT UNIQUE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Monri columns
  order_number VARCHAR(40) UNIQUE,
  monri_transaction_id VARCHAR(50),
  monri_approval_code VARCHAR(20),
  monri_response_code VARCHAR(10),
  monri_pan_token VARCHAR(100),
  monri_masked_pan VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_purchased_at ON public.enrollments(purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_order_number ON public.enrollments(order_number);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;

CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_active_enrollment(p_user_id UUID, p_course_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = p_user_id
      AND course_id = p_course_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. COURSE CONTENT TABLES (LEVELS & CHAPTERS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number INTEGER NOT NULL CHECK (level_number IN (1, 2, 3)),
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  description_en TEXT,
  required_package TEXT CHECK (required_package IN ('basic', 'advanced')),
  required_level INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(level_number)
);

CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  description_en TEXT,
  video_duration INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  video_thumbnail_url TEXT,
  is_preview BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(level_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_levels_level_number ON public.levels(level_number);
CREATE INDEX IF NOT EXISTS idx_levels_is_published ON public.levels(is_published);
CREATE INDEX IF NOT EXISTS idx_chapters_level_id ON public.chapters(level_id);
CREATE INDEX IF NOT EXISTS idx_chapters_is_published ON public.chapters(is_published);
CREATE INDEX IF NOT EXISTS idx_chapters_sort_order ON public.chapters(level_id, sort_order);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published levels" ON public.levels;
DROP POLICY IF EXISTS "Admins can manage levels" ON public.levels;
DROP POLICY IF EXISTS "Anyone can view published chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can manage chapters" ON public.chapters;

CREATE POLICY "Anyone can view published levels" ON public.levels
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage levels" ON public.levels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can view published chapters" ON public.chapters
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage chapters" ON public.chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_levels_updated_at ON public.levels;
DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters;
CREATE TRIGGER update_levels_updated_at
  BEFORE UPDATE ON public.levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default course structure (only if levels table is empty)
INSERT INTO public.levels (level_number, title, title_en, description, description_en, required_package, required_level, is_published, sort_order)
SELECT * FROM (VALUES
  (1, 'Osnove', 'Basics', 'Naučite temelje weft ekstenzija i osnovne tehnike aplikacije.', 'Learn the fundamentals of weft extensions and basic application techniques.', 'basic', 0, true, 1),
  (2, 'Napredne tehnike', 'Advanced Techniques', 'Savladajte napredne metode i složenije stilove.', 'Master advanced methods and more complex styles.', 'basic', 1, true, 2),
  (3, 'Majstorstvo', 'Mastery', 'Postanite certificirani Brendia Pro majstor.', 'Become a certified Brendia Pro master.', 'advanced', 2, true, 3)
) AS v(level_number, title, title_en, description, description_en, required_package, required_level, is_published, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.levels LIMIT 1)
ON CONFLICT (level_number) DO NOTHING;

-- Insert sample chapters for Level 1
INSERT INTO public.chapters (level_id, chapter_number, title, title_en, description, description_en, video_duration, is_preview, sort_order)
SELECT l.id, chapter.num, chapter.title, chapter.title_en, chapter.desc, chapter.desc_en, chapter.duration, chapter.preview, chapter.num
FROM public.levels l
CROSS JOIN (VALUES
  (1, 'Uvod u Brendia Pro', 'Introduction to Brendia Pro', 'Upoznajte se s metodom i alatima.', 'Get familiar with the method and tools.', 720, true),
  (2, 'Priprema kose', 'Hair Preparation', 'Kako pravilno pripremiti kosu klijentice.', 'How to properly prepare client hair.', 1200, false),
  (3, 'Tehnika šivanja', 'Sewing Technique', 'Osnovne tehnike šivanja weft traka.', 'Basic weft sewing techniques.', 1800, false),
  (4, 'Postavljanje ekstenzija', 'Extension Placement', 'Pravilno postavljanje i pozicioniranje.', 'Proper placement and positioning.', 1500, false),
  (5, 'Završna obrada', 'Finishing Touches', 'Blendanje i stiliziranje.', 'Blending and styling.', 900, false)
) AS chapter(num, title, title_en, desc, desc_en, duration, preview)
WHERE l.level_number = 1
  AND NOT EXISTS (SELECT 1 FROM public.chapters c WHERE c.level_id = l.id)
ON CONFLICT (level_id, chapter_number) DO NOTHING;

-- Insert sample chapters for Level 2
INSERT INTO public.chapters (level_id, chapter_number, title, title_en, description, description_en, video_duration, is_preview, sort_order)
SELECT l.id, chapter.num, chapter.title, chapter.title_en, chapter.desc, chapter.desc_en, chapter.duration, chapter.preview, chapter.num
FROM public.levels l
CROSS JOIN (VALUES
  (1, 'Napredne tehnike šivanja', 'Advanced Sewing Techniques', 'Kompleksnije metode za bolju trajnost.', 'More complex methods for better durability.', 1800, false),
  (2, 'Rad s različitim tipovima kose', 'Working with Different Hair Types', 'Prilagodba tehnika za različite teksture.', 'Adapting techniques for different textures.', 1500, false),
  (3, 'Korekcije i popravci', 'Corrections and Repairs', 'Rješavanje uobičajenih problema.', 'Solving common issues.', 1200, false),
  (4, 'Volumen i gustoća', 'Volume and Density', 'Postizanje savršenog volumena.', 'Achieving perfect volume.', 1500, false),
  (5, 'Posebni stilovi', 'Special Styles', 'Rad na posebnim prilikama.', 'Working on special occasions.', 1200, false),
  (6, 'Održavanje i njega', 'Maintenance and Care', 'Savjeti za klijentice.', 'Tips for clients.', 900, false)
) AS chapter(num, title, title_en, desc, desc_en, duration, preview)
WHERE l.level_number = 2
  AND NOT EXISTS (SELECT 1 FROM public.chapters c WHERE c.level_id = l.id)
ON CONFLICT (level_id, chapter_number) DO NOTHING;

-- Insert sample chapters for Level 3
INSERT INTO public.chapters (level_id, chapter_number, title, title_en, description, description_en, video_duration, is_preview, sort_order)
SELECT l.id, chapter.num, chapter.title, chapter.title_en, chapter.desc, chapter.desc_en, chapter.duration, chapter.preview, chapter.num
FROM public.levels l
CROSS JOIN (VALUES
  (1, 'Poslovna strategija', 'Business Strategy', 'Razvoj vašeg poslovanja s ekstenzijama.', 'Growing your extensions business.', 2400, false),
  (2, 'Majstorske tehnike', 'Master Techniques', 'Ekskluzivne napredne metode.', 'Exclusive advanced methods.', 2100, false),
  (3, 'Certificiranje', 'Certification', 'Priprema za službeni ispit.', 'Preparation for official exam.', 1800, false)
) AS chapter(num, title, title_en, desc, desc_en, duration, preview)
WHERE l.level_number = 3
  AND NOT EXISTS (SELECT 1 FROM public.chapters c WHERE c.level_id = l.id)
ON CONFLICT (level_id, chapter_number) DO NOTHING;

-- =====================================================
-- 4. PROGRESS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  watch_percentage INTEGER DEFAULT 0 CHECK (watch_percentage >= 0 AND watch_percentage <= 100),
  watch_time INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_position INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_chapter_id ON public.progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON public.progress(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_progress_updated_at ON public.progress(user_id, updated_at DESC);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.progress;

CREATE POLICY "Users can view own progress" ON public.progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_progress_updated_at ON public.progress;
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to mark chapter as completed when watch_percentage >= 95
CREATE OR REPLACE FUNCTION public.check_chapter_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.watch_percentage >= 95 AND (OLD.completed IS NULL OR NOT OLD.completed) THEN
    NEW.completed := true;
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_progress_completion ON public.progress;
CREATE TRIGGER check_progress_completion
  BEFORE UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.check_chapter_completion();

-- Function to get user's overall course progress (THE MISSING FUNCTION!)
CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id UUID)
RETURNS TABLE (
  level_number INTEGER,
  total_chapters BIGINT,
  completed_chapters BIGINT,
  progress_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.level_number,
    COUNT(c.id) as total_chapters,
    COUNT(CASE WHEN p.completed THEN 1 END) as completed_chapters,
    CASE
      WHEN COUNT(c.id) > 0 THEN
        (COUNT(CASE WHEN p.completed THEN 1 END) * 100 / COUNT(c.id))::INTEGER
      ELSE 0
    END as progress_percentage
  FROM public.levels l
  JOIN public.chapters c ON c.level_id = l.id AND c.is_published = true
  LEFT JOIN public.progress p ON p.chapter_id = c.id AND p.user_id = p_user_id
  GROUP BY l.level_number
  ORDER BY l.level_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get last watched chapter
CREATE OR REPLACE FUNCTION public.get_last_watched(p_user_id UUID)
RETURNS TABLE (
  chapter_id UUID,
  chapter_title TEXT,
  level_number INTEGER,
  last_position INTEGER,
  watch_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as chapter_id,
    c.title as chapter_title,
    l.level_number,
    p.last_position,
    p.watch_percentage
  FROM public.progress p
  JOIN public.chapters c ON c.id = p.chapter_id
  JOIN public.levels l ON l.id = c.level_id
  WHERE p.user_id = p_user_id
    AND p.completed = false
  ORDER BY p.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CERTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'not_eligible' CHECK (status IN (
    'not_eligible', 'eligible', 'applied', 'under_review', 'approved', 'rejected'
  )),
  applied_at TIMESTAMPTZ,
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  certificate_number TEXT UNIQUE,
  certificate_url TEXT,
  level1_completed_at TIMESTAMPTZ,
  level2_completed_at TIMESTAMPTZ,
  level3_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.certifications(status);
CREATE INDEX IF NOT EXISTS idx_certifications_applied_at ON public.certifications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_certifications_certificate_number ON public.certifications(certificate_number);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certification" ON public.certifications;
DROP POLICY IF EXISTS "Users can apply for certification" ON public.certifications;
DROP POLICY IF EXISTS "Admins can view all certifications" ON public.certifications;
DROP POLICY IF EXISTS "Admins can update certifications" ON public.certifications;

CREATE POLICY "Users can view own certification" ON public.certifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can apply for certification" ON public.certifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all certifications" ON public.certifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update certifications" ON public.certifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_certifications_updated_at ON public.certifications;
CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
  result TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YY');
  SELECT LPAD((COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(certificate_number, '^BP-\d{2}-', ''), '')::INTEGER
  ), 0) + 1)::TEXT, 4, '0')
  INTO seq_part
  FROM public.certifications
  WHERE certificate_number LIKE 'BP-' || year_part || '-%';

  result := 'BP-' || year_part || '-' || seq_part;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DEVICES TABLE (for register_device function)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  browser TEXT,
  os TEXT,
  session_token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_current BOOLEAN DEFAULT false,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_active ON public.devices(user_id, last_active DESC);
CREATE INDEX IF NOT EXISTS idx_devices_is_current ON public.devices(user_id, is_current);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can delete own devices" ON public.devices;

CREATE POLICY "Users can view own devices" ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON public.devices
  FOR DELETE USING (auth.uid() = user_id);

-- Function to register/update device on login (THE OTHER MISSING FUNCTION!)
CREATE OR REPLACE FUNCTION public.register_device(
  p_user_id UUID,
  p_device_name TEXT,
  p_device_type TEXT DEFAULT 'unknown',
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_device_id UUID;
  v_device_count INTEGER;
  v_max_devices INTEGER := 3;
BEGIN
  -- Check existing device by user_agent or create new
  SELECT id INTO v_device_id
  FROM public.devices
  WHERE user_id = p_user_id
    AND user_agent = p_user_agent
  LIMIT 1;

  IF v_device_id IS NOT NULL THEN
    -- Update existing device
    UPDATE public.devices SET
      is_current = true,
      last_active = NOW(),
      ip_address = COALESCE(p_ip_address, ip_address)
    WHERE id = v_device_id;
  ELSE
    -- Check device limit
    SELECT COUNT(*) INTO v_device_count
    FROM public.devices
    WHERE user_id = p_user_id;

    IF v_device_count >= v_max_devices THEN
      -- Remove oldest non-current device
      DELETE FROM public.devices
      WHERE id = (
        SELECT id FROM public.devices
        WHERE user_id = p_user_id AND is_current = false
        ORDER BY last_active ASC
        LIMIT 1
      );
    END IF;

    -- Insert new device
    INSERT INTO public.devices (
      user_id, device_name, device_type, browser, os, ip_address, user_agent, is_current
    ) VALUES (
      p_user_id, p_device_name, p_device_type, p_browser, p_os, p_ip_address, p_user_agent, true
    ) RETURNING id INTO v_device_id;
  END IF;

  -- Mark all other devices as not current
  UPDATE public.devices
  SET is_current = false
  WHERE user_id = p_user_id AND id != v_device_id;

  RETURN v_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's device count
CREATE OR REPLACE FUNCTION public.get_device_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.devices WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. WEBSHOP TABLES (products, orders, coupons)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_en TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER,
  currency TEXT DEFAULT 'eur',
  category TEXT NOT NULL CHECK (category IN ('extensions', 'tools', 'care')),
  images TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  specifications JSONB DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webshop_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_full_name TEXT NOT NULL,
  shipping_street TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  coupon_code TEXT,
  coupon_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  stripe_customer_id TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  -- Monri columns
  monri_transaction_id VARCHAR(50),
  monri_approval_code VARCHAR(20),
  monri_response_code VARCHAR(10),
  monri_pan_token VARCHAR(100),
  monri_masked_pan VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  minimum_order INTEGER,
  maximum_discount INTEGER,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  one_per_customer BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published);

CREATE INDEX IF NOT EXISTS idx_webshop_orders_user_id ON public.webshop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_webshop_orders_order_number ON public.webshop_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_webshop_orders_status ON public.webshop_orders(status);
CREATE INDEX IF NOT EXISTS idx_webshop_orders_customer_email ON public.webshop_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_webshop_orders_created_at ON public.webshop_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webshop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view own orders" ON public.webshop_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.webshop_orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.webshop_orders;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

CREATE POLICY "Anyone can view published products" ON public.products
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own orders" ON public.webshop_orders
  FOR SELECT USING (auth.uid() = user_id OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all orders" ON public.webshop_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update orders" ON public.webshop_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_webshop_orders_updated_at ON public.webshop_orders;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;

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

-- Insert sample products (only if table is empty)
INSERT INTO public.products (name, name_en, slug, description, description_en, price, category, images, in_stock, stock_quantity, featured)
SELECT * FROM (VALUES
  ('Brendia Pro Weft Set', 'Brendia Pro Weft Set', 'brendia-pro-weft-set', 'Premium set weft ekstenzija za profesionalnu primjenu.', 'Premium weft extensions set for professional use.', 29900, 'extensions', ARRAY['https://placeholder.com/weft-set.jpg'], true, 50, true),
  ('Profesionalne igle', 'Professional Needles', 'professional-needles', 'Set profesionalnih igala za weft tehniku.', 'Set of professional needles for weft technique.', 1990, 'tools', ARRAY['https://placeholder.com/needles.jpg'], true, 100, false),
  ('Brendia Care Serum', 'Brendia Care Serum', 'brendia-care-serum', 'Serum za njegu ekstenzija i prirodne kose.', 'Serum for extensions and natural hair care.', 2490, 'care', ARRAY['https://placeholder.com/serum.jpg'], true, 75, true)
) AS v(name, name_en, slug, description, description_en, price, category, images, in_stock, stock_quantity, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample coupon (only if table is empty)
INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order, is_active)
SELECT 'WELCOME10', 'Dobrodosli popust 10%', 'percentage', 10, 5000, true
WHERE NOT EXISTS (SELECT 1 FROM public.coupons LIMIT 1)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 8. CREATE PROFILE FOR EXISTING USER
-- =====================================================

-- Create profile for the admin user if it doesn't exist
INSERT INTO public.profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'user'
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DONE!
-- =====================================================
