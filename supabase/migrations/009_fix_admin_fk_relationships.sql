-- 009_fix_admin_fk_relationships.sql
--
-- Fixes admin panel 500 errors ("Failed to fetch certifications/students").
--
-- Root cause: enrollments.user_id and certifications.user_id referenced
-- auth.users(id) only. PostgREST cannot embed public.profiles into these
-- tables (PGRST200: "Could not find a relationship ... in the schema cache"),
-- so any admin query that joins profiles returns a 500.
--
-- Since profiles.id == auth.users.id (1:1), we add an ADDITIONAL foreign key
-- from each user_id column to public.profiles(id). This gives PostgREST the
-- relationship it needs to embed profiles, without removing the existing
-- auth.users constraint.

-- 1. Backfill: make sure every auth user has a profile row, otherwise the new
--    FK would fail on orphan rows. full_name is NOT NULL, so provide a fallback.
INSERT INTO public.profiles (id, full_name, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'Nepoznato'),
  'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. enrollments.user_id -> profiles.id
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_user_id_profiles_fkey;
ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. certifications.user_id -> profiles.id
ALTER TABLE public.certifications
  DROP CONSTRAINT IF EXISTS certifications_user_id_profiles_fkey;
ALTER TABLE public.certifications
  ADD CONSTRAINT certifications_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Tell PostgREST to reload its schema cache immediately (otherwise it can
--    take a minute for the new relationships to be picked up).
NOTIFY pgrst, 'reload schema';
