-- =====================================================
-- MIGRATION 017: CHAPTER SUBTITLE FILES
-- =====================================================
-- The corrected HR + EN captions live in the Supabase `subtitles` bucket as
-- `<slug>.hr.vtt` / `<slug>.en.vtt`, but the chapter→slug mapping only existed
-- in the upload script's runtime manifest — nothing on the chapters row points
-- at a VTT. The mobile app can't use Mux's HLS-embedded tracks, so it needs the
-- raw VTT URL. Store the bucket object names here so the chapter API can hand
-- back signed URLs.

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS subtitle_hr TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_en TEXT;

-- Populate for the 7 filmed Artist chapters (matched by title).
UPDATE public.chapters SET subtitle_hr = 'uvod-level-1.hr.vtt',                subtitle_en = 'uvod-level-1.en.vtt'                WHERE title = 'Uvod Level 1';
UPDATE public.chapters SET subtitle_hr = 'bead-level-2.hr.vtt',                subtitle_en = 'bead-level-2.en.vtt'                WHERE title = 'Bead Level 2';
UPDATE public.chapters SET subtitle_hr = 'donji-weft-level-3.hr.vtt',          subtitle_en = 'donji-weft-level-3.en.vtt'          WHERE title = 'Donji Weft Level 3';
UPDATE public.chapters SET subtitle_hr = '-ivanje-donjeg-weft-a-level-4.hr.vtt', subtitle_en = '-ivanje-donjeg-weft-a-level-4.en.vtt' WHERE title = 'Šivanje Donjeg Weft-a Level 4';
UPDATE public.chapters SET subtitle_hr = 'gornji-weft-level-5.hr.vtt',         subtitle_en = 'gornji-weft-level-5.en.vtt'         WHERE title = 'Gornji Weft Level 5';
UPDATE public.chapters SET subtitle_hr = 'farbanje-level-6.hr.vtt',            subtitle_en = 'farbanje-level-6.en.vtt'            WHERE title = 'Farbanje Level 6';
UPDATE public.chapters SET subtitle_hr = 'mija-level-7.hr.vtt',               subtitle_en = 'mija-level-7.en.vtt'               WHERE title = 'Mija Level 7';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
