-- =====================================================
-- MIGRATION 012: COURSE RESTRUCTURE
-- =====================================================
-- Business reality: two courses.
--   * Brendia Pro® Artist (basic package, €3,000 + PDV) = 8 videos,
--     one video per chapter -> Level 1 with 8 chapters.
--   * Advanced Brendia Pro® Artist (advanced package, €4,000 + PDV),
--     not filmed yet -> Level 2, UNPUBLISHED until content exists.
--     Purchasable only after the Artist certification is APPROVED
--     (enforced in the marketing checkout API).
--
-- NOTE: this deletes 3 placeholder chapters of the old Level 2 and
-- reparents its first 3 into Level 1. Any test progress/photo
-- submissions on deleted chapters are removed via CASCADE.
-- Safe pre-launch; do NOT rerun on a live database with real students.

-- 1. Move the first 3 chapters of old Level 2 into Level 1 as chapters 6-8
UPDATE public.chapters c
SET
  level_id = (SELECT id FROM public.levels WHERE level_number = 1),
  chapter_number = c.chapter_number + 5,
  sort_order = c.sort_order + 5
WHERE c.level_id = (SELECT id FROM public.levels WHERE level_number = 2)
  AND c.chapter_number <= 3;

-- 2. Drop the rest of old Level 2 (placeholder chapters 4-6) and the level
DELETE FROM public.chapters
WHERE level_id = (SELECT id FROM public.levels WHERE level_number = 2);

DELETE FROM public.levels WHERE level_number = 2;

-- 3. Level 1 is the Artist course
UPDATE public.levels
SET
  title = 'Brendia Pro® Artist',
  title_en = 'Brendia Pro® Artist',
  description = 'Kompletna edukacija za weft ekstenzije - od pripreme do završne obrade, u 8 video lekcija.',
  description_en = 'Complete weft extensions education - from preparation to finishing, in 8 video lessons.',
  required_package = 'basic',
  required_level = 0,
  updated_at = NOW()
WHERE level_number = 1;

-- 4. Old Level 3 becomes Level 2: the Advanced course (hidden until filmed)
UPDATE public.levels
SET
  level_number = 2,
  title = 'Advanced Brendia Pro® Artist',
  title_en = 'Advanced Brendia Pro® Artist',
  description = 'Napredna edukacija za certificirane Brendia Pro® Artist studentice.',
  description_en = 'Advanced education for certified Brendia Pro® Artist students.',
  required_package = 'advanced',
  required_level = 1,
  is_published = false,
  sort_order = 2,
  updated_at = NOW()
WHERE level_number = 3;

-- Hide its placeholder chapters until real videos are added
UPDATE public.chapters
SET is_published = false
WHERE level_id = (SELECT id FROM public.levels WHERE level_number = 2);

-- =====================================================
-- 5. PACKAGE-BASED CERTIFICATION ELIGIBILITY
-- =====================================================
-- Eligibility = every published chapter in every published
-- BASIC-package level is watched AND, where photos are required,
-- has an APPROVED submission. (Previously hardcoded to levels 1+2.)
-- Both level1/level2_completed_at are set to the Artist completion
-- time so existing requirement displays keep working.

CREATE OR REPLACE FUNCTION public.update_certification_eligibility(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_basic_complete BOOLEAN;
  v_basic_completed_at TIMESTAMPTZ;
BEGIN
  SELECT
    CASE WHEN COUNT(*) > 0
      AND COUNT(*) = COUNT(CASE WHEN p.completed THEN 1 END)
      AND COUNT(CASE WHEN c.requires_photos THEN 1 END) =
          COUNT(CASE WHEN c.requires_photos AND aps.approved THEN 1 END)
    THEN true ELSE false END,
    MAX(CASE WHEN p.completed THEN p.completed_at END)
  INTO v_basic_complete, v_basic_completed_at
  FROM public.chapters c
  JOIN public.levels l ON l.id = c.level_id
    AND l.required_package = 'basic'
    AND l.is_published = true
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

  IF v_basic_complete THEN
    INSERT INTO public.certifications (user_id, status, level1_completed_at, level2_completed_at)
    VALUES (p_user_id, 'eligible', v_basic_completed_at, v_basic_completed_at)
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
    VALUES (p_user_id, 'not_eligible', v_basic_completed_at, v_basic_completed_at)
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

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
