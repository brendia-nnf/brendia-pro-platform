-- =====================================================
-- MIGRATION 013: WATCH-BASED LEVEL PROGRESS
-- =====================================================
-- The dashboard previously showed level progress as
-- completed_chapters / total_chapters, so partially
-- watched videos displayed as 0%. Level progress is now
-- the average watch percentage across published chapters
-- (completed chapters count as 100). completed_chapters
-- is unchanged and certification logic is unaffected.

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
        ROUND(AVG(
          CASE
            WHEN p.completed THEN 100
            ELSE LEAST(COALESCE(p.watch_percentage, 0), 100)
          END
        ))::INTEGER
      ELSE 0
    END as progress_percentage
  FROM public.levels l
  JOIN public.chapters c ON c.level_id = l.id AND c.is_published = true
  LEFT JOIN public.progress p ON p.chapter_id = c.id AND p.user_id = p_user_id
  WHERE l.is_published = true
  GROUP BY l.level_number
  ORDER BY l.level_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
