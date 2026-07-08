-- Create progress tracking table
CREATE TABLE public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- References
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,

  -- Progress Data
  watch_percentage INTEGER DEFAULT 0 CHECK (watch_percentage >= 0 AND watch_percentage <= 100),
  watch_time INTEGER DEFAULT 0, -- Seconds watched
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Last Position (for resume)
  last_position INTEGER DEFAULT 0, -- Seconds from start

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, chapter_id)
);

-- Create indexes
CREATE INDEX idx_progress_user_id ON public.progress(user_id);
CREATE INDEX idx_progress_chapter_id ON public.progress(chapter_id);
CREATE INDEX idx_progress_completed ON public.progress(user_id, completed);
CREATE INDEX idx_progress_updated_at ON public.progress(user_id, updated_at DESC);

-- Enable RLS
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view and manage their own progress
CREATE POLICY "Users can view own progress" ON public.progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all progress
CREATE POLICY "Service role can manage progress" ON public.progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress" ON public.progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update timestamp trigger
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to mark chapter as completed when watch_percentage >= 95
CREATE OR REPLACE FUNCTION public.check_chapter_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.watch_percentage >= 95 AND NOT OLD.completed THEN
    NEW.completed := true;
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_progress_completion
  BEFORE UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.check_chapter_completion();

-- Function to get user's overall course progress
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
