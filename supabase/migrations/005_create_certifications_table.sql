-- Create certifications table
CREATE TABLE public.certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User Reference
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Certification Status
  status TEXT DEFAULT 'not_eligible' CHECK (status IN (
    'not_eligible', -- Hasn't completed required courses
    'eligible',     -- Completed courses, can apply
    'applied',      -- Application submitted
    'under_review', -- Being reviewed by admin
    'approved',     -- Certification granted
    'rejected'      -- Application rejected
  )),

  -- Application Data
  applied_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Review Data
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Certificate Details
  approved_at TIMESTAMPTZ,
  certificate_number TEXT UNIQUE,
  certificate_url TEXT,

  -- Level Completion Timestamps
  level1_completed_at TIMESTAMPTZ,
  level2_completed_at TIMESTAMPTZ,
  level3_completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_certifications_user_id ON public.certifications(user_id);
CREATE INDEX idx_certifications_status ON public.certifications(status);
CREATE INDEX idx_certifications_applied_at ON public.certifications(applied_at DESC);
CREATE INDEX idx_certifications_certificate_number ON public.certifications(certificate_number);

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own certification
CREATE POLICY "Users can view own certification" ON public.certifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can apply for certification (insert)
CREATE POLICY "Users can apply for certification" ON public.certifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all certifications
CREATE POLICY "Service role can manage certifications" ON public.certifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view and update all certifications
CREATE POLICY "Admins can view all certifications" ON public.certifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update certifications" ON public.certifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update timestamp trigger
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

-- Function to check and update certification eligibility
CREATE OR REPLACE FUNCTION public.update_certification_eligibility(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_level1_complete BOOLEAN;
  v_level2_complete BOOLEAN;
  v_level1_completed_at TIMESTAMPTZ;
  v_level2_completed_at TIMESTAMPTZ;
  v_current_status TEXT;
BEGIN
  -- Check Level 1 completion
  SELECT
    CASE WHEN COUNT(*) > 0 AND COUNT(*) = COUNT(CASE WHEN p.completed THEN 1 END) THEN true ELSE false END,
    MAX(CASE WHEN p.completed THEN p.completed_at END)
  INTO v_level1_complete, v_level1_completed_at
  FROM public.chapters c
  JOIN public.levels l ON l.id = c.level_id AND l.level_number = 1
  LEFT JOIN public.progress p ON p.chapter_id = c.id AND p.user_id = p_user_id
  WHERE c.is_published = true;

  -- Check Level 2 completion
  SELECT
    CASE WHEN COUNT(*) > 0 AND COUNT(*) = COUNT(CASE WHEN p.completed THEN 1 END) THEN true ELSE false END,
    MAX(CASE WHEN p.completed THEN p.completed_at END)
  INTO v_level2_complete, v_level2_completed_at
  FROM public.chapters c
  JOIN public.levels l ON l.id = c.level_id AND l.level_number = 2
  LEFT JOIN public.progress p ON p.chapter_id = c.id AND p.user_id = p_user_id
  WHERE c.is_published = true;

  -- Get current status
  SELECT status INTO v_current_status
  FROM public.certifications
  WHERE user_id = p_user_id;

  -- Update or insert certification record
  IF v_level1_complete AND v_level2_complete THEN
    INSERT INTO public.certifications (user_id, status, level1_completed_at, level2_completed_at)
    VALUES (p_user_id, 'eligible', v_level1_completed_at, v_level2_completed_at)
    ON CONFLICT (user_id) DO UPDATE SET
      status = CASE
        WHEN public.certifications.status IN ('not_eligible') THEN 'eligible'
        ELSE public.certifications.status
      END,
      level1_completed_at = EXCLUDED.level1_completed_at,
      level2_completed_at = EXCLUDED.level2_completed_at,
      updated_at = NOW();
  ELSE
    -- Insert with not_eligible if no record exists
    INSERT INTO public.certifications (user_id, status, level1_completed_at, level2_completed_at)
    VALUES (p_user_id, 'not_eligible', v_level1_completed_at, v_level2_completed_at)
    ON CONFLICT (user_id) DO UPDATE SET
      level1_completed_at = EXCLUDED.level1_completed_at,
      level2_completed_at = EXCLUDED.level2_completed_at,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update certification eligibility when progress changes
CREATE OR REPLACE FUNCTION public.trigger_update_certification_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    PERFORM public.update_certification_eligibility(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_progress_completed
  AFTER UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_certification_eligibility();
