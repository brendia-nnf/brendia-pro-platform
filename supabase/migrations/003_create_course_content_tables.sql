-- Create course levels table
CREATE TABLE public.levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Level Details
  level_number INTEGER NOT NULL CHECK (level_number IN (1, 2, 3)),
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  description_en TEXT,

  -- Access Requirements
  required_package TEXT CHECK (required_package IN ('basic', 'advanced')),
  required_level INTEGER DEFAULT 0, -- Previous level that must be completed

  -- Metadata
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(level_number)
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Level Reference
  level_id UUID REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,

  -- Chapter Details
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  description_en TEXT,

  -- Video Information
  video_duration INTEGER NOT NULL DEFAULT 0, -- Duration in seconds
  video_url TEXT, -- Mux playback ID or direct URL
  video_thumbnail_url TEXT,

  -- Access Control
  is_preview BOOLEAN DEFAULT false, -- Free preview chapters
  is_published BOOLEAN DEFAULT true,

  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(level_id, chapter_number)
);

-- Create indexes
CREATE INDEX idx_levels_level_number ON public.levels(level_number);
CREATE INDEX idx_levels_is_published ON public.levels(is_published);
CREATE INDEX idx_chapters_level_id ON public.chapters(level_id);
CREATE INDEX idx_chapters_is_published ON public.chapters(is_published);
CREATE INDEX idx_chapters_sort_order ON public.chapters(level_id, sort_order);

-- Enable RLS
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Levels Policies
-- Everyone can view published levels
CREATE POLICY "Anyone can view published levels" ON public.levels
  FOR SELECT
  USING (is_published = true);

-- Admins can manage all levels
CREATE POLICY "Admins can manage levels" ON public.levels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can manage levels
CREATE POLICY "Service role can manage levels" ON public.levels
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chapters Policies
-- Everyone can view published chapters (video URL requires enrollment check)
CREATE POLICY "Anyone can view published chapters" ON public.chapters
  FOR SELECT
  USING (is_published = true);

-- Admins can manage all chapters
CREATE POLICY "Admins can manage chapters" ON public.chapters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can manage chapters
CREATE POLICY "Service role can manage chapters" ON public.chapters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update timestamp triggers
CREATE TRIGGER update_levels_updated_at
  BEFORE UPDATE ON public.levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default course structure
INSERT INTO public.levels (level_number, title, title_en, description, description_en, required_package, required_level, is_published, sort_order) VALUES
(1, 'Osnove', 'Basics', 'Naučite temelje weft ekstenzija i osnovne tehnike aplikacije.', 'Learn the fundamentals of weft extensions and basic application techniques.', 'basic', 0, true, 1),
(2, 'Napredne tehnike', 'Advanced Techniques', 'Savladajte napredne metode i složenije stilove.', 'Master advanced methods and more complex styles.', 'basic', 1, true, 2),
(3, 'Majstorstvo', 'Mastery', 'Postanite certificirani Brendia Pro majstor.', 'Become a certified Brendia Pro master.', 'advanced', 2, true, 3);

-- Insert sample chapters for Level 1
INSERT INTO public.chapters (level_id, chapter_number, title, title_en, description, description_en, video_duration, is_preview, sort_order)
SELECT
  l.id,
  chapter.num,
  chapter.title,
  chapter.title_en,
  chapter.desc,
  chapter.desc_en,
  chapter.duration,
  chapter.preview,
  chapter.num
FROM public.levels l
CROSS JOIN (VALUES
  (1, 'Uvod u Brendia Pro', 'Introduction to Brendia Pro', 'Upoznajte se s metodom i alatima.', 'Get familiar with the method and tools.', 720, true),
  (2, 'Priprema kose', 'Hair Preparation', 'Kako pravilno pripremiti kosu klijentice.', 'How to properly prepare client hair.', 1200, false),
  (3, 'Tehnika šivanja', 'Sewing Technique', 'Osnovne tehnike šivanja weft traka.', 'Basic weft sewing techniques.', 1800, false),
  (4, 'Postavljanje ekstenzija', 'Extension Placement', 'Pravilno postavljanje i pozicioniranje.', 'Proper placement and positioning.', 1500, false),
  (5, 'Završna obrada', 'Finishing Touches', 'Blendanje i stiliziranje.', 'Blending and styling.', 900, false)
) AS chapter(num, title, title_en, desc, desc_en, duration, preview)
WHERE l.level_number = 1;

-- Insert sample chapters for Level 2
INSERT INTO public.chapters (level_id, chapter_number, title, title_en, description, description_en, video_duration, is_preview, sort_order)
SELECT
  l.id,
  chapter.num,
  chapter.title,
  chapter.title_en,
  chapter.desc,
  chapter.desc_en,
  chapter.duration,
  chapter.preview,
  chapter.num
FROM public.levels l
CROSS JOIN (VALUES
  (1, 'Napredne tehnike šivanja', 'Advanced Sewing Techniques', 'Kompleksnije metode za bolju trajnost.', 'More complex methods for better durability.', 1800, false),
  (2, 'Rad s različitim tipovima kose', 'Working with Different Hair Types', 'Prilagodba tehnika za različite teksture.', 'Adapting techniques for different textures.', 1500, false),
  (3, 'Korekcije i popravci', 'Corrections and Repairs', 'Rješavanje uobičajenih problema.', 'Solving common issues.', 1200, false),
  (4, 'Volumen i gustoća', 'Volume and Density', 'Postizanje savršenog volumena.', 'Achieving perfect volume.', 1500, false),
  (5, 'Posebni stilovi', 'Special Styles', 'Rad na posebnim prilikama.', 'Working on special occasions.', 1200, false),
  (6, 'Održavanje i njega', 'Maintenance and Care', 'Savjeti za klijentice.', 'Tips for clients.', 900, false)
) AS chapter(num, title, title_en, desc, desc_en, duration, preview)
WHERE l.level_number = 2;

-- Insert sample chapters for Level 3
INSERT INTO public.chapters (level_id, chapter_number, title, title_en, description, description_en, video_duration, is_preview, sort_order)
SELECT
  l.id,
  chapter.num,
  chapter.title,
  chapter.title_en,
  chapter.desc,
  chapter.desc_en,
  chapter.duration,
  chapter.preview,
  chapter.num
FROM public.levels l
CROSS JOIN (VALUES
  (1, 'Poslovna strategija', 'Business Strategy', 'Razvoj vašeg poslovanja s ekstenzijama.', 'Growing your extensions business.', 2400, false),
  (2, 'Majstorske tehnike', 'Master Techniques', 'Ekskluzivne napredne metode.', 'Exclusive advanced methods.', 2100, false),
  (3, 'Certificiranje', 'Certification', 'Priprema za službeni ispit.', 'Preparation for official exam.', 1800, false)
) AS chapter(num, title, title_en, desc, desc_en, duration, preview)
WHERE l.level_number = 3;
