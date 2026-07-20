-- =====================================================
-- MIGRATION 016: ENROLLMENT COURSE-ACCESS FLAG
-- =====================================================
-- Business reality: not every purchase grants access to the video
-- course materials. The 1-on-1 coaching products
-- (brendia-pro-artist-1v1, brendia-pro-master-1v1) give the buyer
-- full PLATFORM access (webshop, messages, dashboard, orders) but
-- must NOT unlock the recorded course lessons.
--
-- Previously the access gate only compared enrollments.package against
-- levels.required_package, so a 1v1 buyer (package 'basic'/'advanced')
-- saw the whole Artist/Advanced course. This adds an explicit flag the
-- gate can check instead of inferring access from the package tier.

-- 1. Add the flag. Default true so existing course enrollments keep access.
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS grants_course_access BOOLEAN NOT NULL DEFAULT true;

-- 2. Backfill: any existing 1v1/coaching enrollment loses course access.
UPDATE public.enrollments
SET grants_course_access = false
WHERE course_id IN ('brendia-pro-artist-1v1', 'brendia-pro-master-1v1');

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
