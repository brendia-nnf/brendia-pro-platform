-- Create enrollments table
-- Tracks user course purchases and access

CREATE TABLE public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User Reference
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Course/Package Details
  course_id TEXT NOT NULL, -- 'foundation', 'master', 'advanced'
  package TEXT NOT NULL CHECK (package IN ('basic', 'advanced')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'refunded')),

  -- Pricing (stored in cents)
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',

  -- Stripe References
  stripe_payment_intent TEXT,
  stripe_customer_id TEXT,
  stripe_session_id TEXT UNIQUE,

  -- Validity
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for lifetime access

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_enrollments_stripe_session ON public.enrollments(stripe_session_id);
CREATE INDEX idx_enrollments_purchased_at ON public.enrollments(purchased_at DESC);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all enrollments
CREATE POLICY "Service role can manage enrollments" ON public.enrollments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON public.enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update timestamp trigger
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has active enrollment for a course
CREATE OR REPLACE FUNCTION public.has_active_enrollment(
  p_user_id UUID,
  p_course_id TEXT
)
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
