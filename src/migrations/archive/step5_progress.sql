-- Étape 5 : Création des tables pour le suivi des inscriptions et de la progression

-- Table des inscriptions aux formations
CREATE TABLE IF NOT EXISTS public.user_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount_paid DECIMAL(10, 2),
  UNIQUE(user_id, formation_id)
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_user_formations_user_id ON public.user_formations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_formations_formation_id ON public.user_formations(formation_id);

-- Politique RLS pour user_formations
ALTER TABLE public.user_formations ENABLE ROW LEVEL SECURITY;

-- Politique pour les inscriptions
CREATE POLICY "Les utilisateurs peuvent voir leurs propres inscriptions" 
ON public.user_formations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent voir toutes les inscriptions" 
ON public.user_formations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Table du suivi de progression
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  last_position INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- temps passé en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_formation_id ON public.user_progress(formation_id);

-- Politique RLS pour user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Politique pour la progression
CREATE POLICY "Les utilisateurs peuvent voir et modifier leur propre progression" 
ON public.user_progress FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent voir toutes les progressions" 
ON public.user_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 