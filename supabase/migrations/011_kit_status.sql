-- =====================================================
-- MIGRATION 011: KIT STATUS ON ENROLLMENTS
-- =====================================================
-- The Brendia Pro kit (welcome box) is shipped once per
-- course purchase. Status is managed by the admin in the
-- students table and displayed on the student dashboard.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS kit_status TEXT DEFAULT 'preparing'
    CHECK (kit_status IN ('preparing', 'shipped', 'delivered')),
  ADD COLUMN IF NOT EXISTS kit_tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS kit_shipped_at TIMESTAMPTZ;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
