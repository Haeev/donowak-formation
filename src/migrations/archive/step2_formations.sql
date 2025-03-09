-- Étape 2 : Création de la table des formations
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  price DECIMAL(10, 2) DEFAULT 0,
  duration INTEGER, -- durée en heures
  published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politique RLS pour formations
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

-- Politique pour les formations
CREATE POLICY "Tout le monde peut voir les formations publiées" 
ON public.formations FOR SELECT
USING (published = TRUE);

CREATE POLICY "Les administrateurs peuvent tout faire avec les formations" 
ON public.formations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 