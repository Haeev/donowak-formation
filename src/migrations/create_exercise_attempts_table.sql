-- Création de la table pour stocker les tentatives d'exercices
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  answers JSONB,
  time_spent INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON public.exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_lesson_id ON public.exercise_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON public.exercise_attempts(exercise_id);

-- Politique RLS pour exercise_attempts
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

-- Politique pour les tentatives d'exercices
CREATE POLICY "Les utilisateurs peuvent voir leurs propres tentatives d'exercices" 
ON public.exercise_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres tentatives d'exercices" 
ON public.exercise_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres tentatives d'exercices" 
ON public.exercise_attempts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent tout voir" 
ON public.exercise_attempts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Création de l'API pour les tentatives d'exercices
CREATE OR REPLACE FUNCTION public.get_user_exercise_attempts(
  p_user_id UUID DEFAULT auth.uid(),
  p_lesson_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  lesson_id UUID,
  exercise_id TEXT,
  score NUMERIC,
  max_score NUMERIC,
  answers JSONB,
  time_spent INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si l'utilisateur est administrateur ou le propriétaire des données
  IF (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin' OR auth.uid() = p_user_id THEN
    RETURN QUERY
    SELECT 
      ea.id,
      ea.lesson_id,
      ea.exercise_id,
      ea.score,
      ea.max_score,
      ea.answers,
      ea.time_spent,
      ea.created_at
    FROM 
      public.exercise_attempts ea
    WHERE 
      ea.user_id = p_user_id
      AND (p_lesson_id IS NULL OR ea.lesson_id = p_lesson_id)
    ORDER BY 
      ea.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Non autorisé';
  END IF;
END;
$$; 