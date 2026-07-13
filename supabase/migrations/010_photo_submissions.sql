-- =====================================================
-- MIGRATION 010: PHOTO SUBMISSIONS (STUDENT WORK)
-- =====================================================
-- After each practical chapter, students must submit 3
-- photos of their work (front, left, right) before the
-- next chapter unlocks. Admin reviews with approve/redo.
-- Certification eligibility requires approved photo sets.
-- =====================================================

-- =====================================================
-- 1. CHAPTERS: requires_photos FLAG
-- =====================================================
-- Only practical chapters require photo submissions.
-- Defaults to false; toggled per chapter in the admin
-- content editor (/admin/sadrzaj).

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS requires_photos BOOLEAN DEFAULT false;

-- =====================================================
-- 2. PHOTO SUBMISSIONS TABLE
-- =====================================================
-- One row per submission attempt. Redo requests create a
-- new attempt; previous attempts are kept as history.
-- Paths reference the private 'student-work' bucket and
-- are converted to signed URLs by the API.

CREATE TABLE IF NOT EXISTS public.photo_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  attempt_number INTEGER DEFAULT 1 NOT NULL,
  photo_front_path TEXT NOT NULL,
  photo_left_path TEXT NOT NULL,
  photo_right_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'redo_requested'
  )),
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_photo_submissions_user_id ON public.photo_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_submissions_chapter_id ON public.photo_submissions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_photo_submissions_status ON public.photo_submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_submissions_user_chapter ON public.photo_submissions(user_id, chapter_id, attempt_number DESC);

ALTER TABLE public.photo_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own photo submissions" ON public.photo_submissions;
DROP POLICY IF EXISTS "Users can insert own photo submissions" ON public.photo_submissions;
DROP POLICY IF EXISTS "Admins can view all photo submissions" ON public.photo_submissions;
DROP POLICY IF EXISTS "Admins can update photo submissions" ON public.photo_submissions;

CREATE POLICY "Users can view own photo submissions" ON public.photo_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photo submissions" ON public.photo_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all photo submissions" ON public.photo_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update photo submissions" ON public.photo_submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Additional FK to public.profiles so PostgREST can embed profile data
-- in admin queries (same pattern as migration 009)
ALTER TABLE public.photo_submissions
  DROP CONSTRAINT IF EXISTS photo_submissions_user_id_profiles_fkey;
ALTER TABLE public.photo_submissions
  ADD CONSTRAINT photo_submissions_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DROP TRIGGER IF EXISTS update_photo_submissions_updated_at ON public.photo_submissions;
CREATE TRIGGER update_photo_submissions_updated_at
  BEFORE UPDATE ON public.photo_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. PRIVATE STORAGE BUCKET FOR STUDENT WORK
-- =====================================================
-- Student photos contain personal data (real models),
-- so the bucket is private and served via signed URLs.
-- Path scheme: {user_id}/{chapter_id}/{timestamp}-{angle}.{ext}

INSERT INTO storage.buckets (id, name, public)
VALUES ('student-work', 'student-work', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Students can upload own work" ON storage.objects;
DROP POLICY IF EXISTS "Students can view own work" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all student work" ON storage.objects;

CREATE POLICY "Students can upload own work" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'student-work'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can view own work" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'student-work'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all student work" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'student-work'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 4. CHAPTER ACCESS CHECK (SERVER-SIDE GATE)
-- =====================================================
-- A chapter can be started only when the previous chapter
-- (within the level, or the last chapter of the previous
-- level) is completed AND, if it requires photos, has at
-- least one photo submission (any status - the gate is on
-- submitting, not on approval).

CREATE OR REPLACE FUNCTION public.can_start_chapter(p_user_id UUID, p_chapter_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_level_id UUID;
  v_level_number INTEGER;
  v_sort_order INTEGER;
  v_prev_id UUID;
  v_prev_requires_photos BOOLEAN;
  v_prev_completed BOOLEAN;
  v_has_submission BOOLEAN;
BEGIN
  SELECT c.level_id, l.level_number, c.sort_order
  INTO v_level_id, v_level_number, v_sort_order
  FROM public.chapters c
  JOIN public.levels l ON l.id = c.level_id
  WHERE c.id = p_chapter_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'chapter_not_found');
  END IF;

  -- Previous chapter within the same level
  SELECT c.id, c.requires_photos
  INTO v_prev_id, v_prev_requires_photos
  FROM public.chapters c
  WHERE c.level_id = v_level_id
    AND c.is_published = true
    AND c.sort_order < v_sort_order
  ORDER BY c.sort_order DESC
  LIMIT 1;

  -- First chapter of a level: previous level's last chapter
  IF v_prev_id IS NULL THEN
    SELECT c.id, c.requires_photos
    INTO v_prev_id, v_prev_requires_photos
    FROM public.chapters c
    JOIN public.levels l ON l.id = c.level_id
    WHERE l.level_number < v_level_number
      AND c.is_published = true
    ORDER BY l.level_number DESC, c.sort_order DESC
    LIMIT 1;
  END IF;

  -- Very first chapter of the course
  IF v_prev_id IS NULL THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;

  SELECT COALESCE(p.completed, false)
  INTO v_prev_completed
  FROM public.progress p
  WHERE p.user_id = p_user_id AND p.chapter_id = v_prev_id;

  IF NOT COALESCE(v_prev_completed, false) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'previous_chapter_incomplete',
      'previousChapterId', v_prev_id
    );
  END IF;

  IF v_prev_requires_photos THEN
    SELECT EXISTS (
      SELECT 1 FROM public.photo_submissions ps
      WHERE ps.user_id = p_user_id AND ps.chapter_id = v_prev_id
    ) INTO v_has_submission;

    IF NOT v_has_submission THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'photos_required',
        'previousChapterId', v_prev_id
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CERTIFICATION ELIGIBILITY WITH PHOTO APPROVALS
-- =====================================================
-- A level now counts as complete when all published
-- chapters are watched AND every chapter that requires
-- photos has an APPROVED submission.

CREATE OR REPLACE FUNCTION public.update_certification_eligibility(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_level1_complete BOOLEAN;
  v_level2_complete BOOLEAN;
  v_level1_completed_at TIMESTAMPTZ;
  v_level2_completed_at TIMESTAMPTZ;
BEGIN
  -- Check Level 1 completion (watched + photos approved)
  SELECT
    CASE WHEN COUNT(*) > 0
      AND COUNT(*) = COUNT(CASE WHEN p.completed THEN 1 END)
      AND COUNT(CASE WHEN c.requires_photos THEN 1 END) =
          COUNT(CASE WHEN c.requires_photos AND aps.approved THEN 1 END)
    THEN true ELSE false END,
    MAX(CASE WHEN p.completed THEN p.completed_at END)
  INTO v_level1_complete, v_level1_completed_at
  FROM public.chapters c
  JOIN public.levels l ON l.id = c.level_id AND l.level_number = 1
  LEFT JOIN public.progress p ON p.chapter_id = c.id AND p.user_id = p_user_id
  LEFT JOIN LATERAL (
    SELECT true AS approved
    FROM public.photo_submissions ps
    WHERE ps.chapter_id = c.id
      AND ps.user_id = p_user_id
      AND ps.status = 'approved'
    LIMIT 1
  ) aps ON true
  WHERE c.is_published = true;

  -- Check Level 2 completion (watched + photos approved)
  SELECT
    CASE WHEN COUNT(*) > 0
      AND COUNT(*) = COUNT(CASE WHEN p.completed THEN 1 END)
      AND COUNT(CASE WHEN c.requires_photos THEN 1 END) =
          COUNT(CASE WHEN c.requires_photos AND aps.approved THEN 1 END)
    THEN true ELSE false END,
    MAX(CASE WHEN p.completed THEN p.completed_at END)
  INTO v_level2_complete, v_level2_completed_at
  FROM public.chapters c
  JOIN public.levels l ON l.id = c.level_id AND l.level_number = 2
  LEFT JOIN public.progress p ON p.chapter_id = c.id AND p.user_id = p_user_id
  LEFT JOIN LATERAL (
    SELECT true AS approved
    FROM public.photo_submissions ps
    WHERE ps.chapter_id = c.id
      AND ps.user_id = p_user_id
      AND ps.status = 'approved'
    LIMIT 1
  ) aps ON true
  WHERE c.is_published = true;

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
    INSERT INTO public.certifications (user_id, status, level1_completed_at, level2_completed_at)
    VALUES (p_user_id, 'not_eligible', v_level1_completed_at, v_level2_completed_at)
    ON CONFLICT (user_id) DO UPDATE SET
      status = CASE
        WHEN public.certifications.status = 'eligible' THEN 'not_eligible'
        ELSE public.certifications.status
      END,
      level1_completed_at = EXCLUDED.level1_completed_at,
      level2_completed_at = EXCLUDED.level2_completed_at,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-run eligibility when a photo submission is approved
-- (or an approval is revoked by requesting a redo).

CREATE OR REPLACE FUNCTION public.trigger_photo_submission_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.update_certification_eligibility(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_photo_submission_reviewed ON public.photo_submissions;
CREATE TRIGGER on_photo_submission_reviewed
  AFTER UPDATE ON public.photo_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_photo_submission_eligibility();

-- Reload PostgREST schema cache so new table/relationships are picked up
NOTIFY pgrst, 'reload schema';
