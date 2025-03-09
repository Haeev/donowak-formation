-- Étape 4 : Création de la table des leçons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  description TEXT,
  position INTEGER NOT NULL,
  duration INTEGER, -- durée en minutes
  video_url TEXT,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON public.lessons(chapter_id);

-- Politique RLS pour lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Politique pour les leçons
CREATE POLICY "Tout le monde peut voir les leçons des formations publiées" 
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chapters
    JOIN public.formations ON chapters.formation_id = formations.id
    WHERE chapters.id = lessons.chapter_id
    AND formations.published = TRUE
  )
); 