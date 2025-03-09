-- Étape 3 : Création de la table des chapitres
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_chapters_formation_id ON public.chapters(formation_id);

-- Politique RLS pour chapters
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Politique pour les chapitres
CREATE POLICY "Tout le monde peut voir les chapitres des formations publiées" 
ON public.chapters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.formations
    WHERE formations.id = chapters.formation_id
    AND formations.published = TRUE
  )
); 