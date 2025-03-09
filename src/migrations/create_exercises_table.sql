-- Création de la table des exercices
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  items JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout d'un trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Ajout des politiques RLS pour les exercices
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (CRUD complet)
CREATE POLICY admin_exercises_policy ON public.exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Politique pour les utilisateurs (lecture seule pour les exercices des leçons publiées)
CREATE POLICY users_exercises_read_policy ON public.exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.chapters ON lessons.chapter_id = chapters.id
      JOIN public.formations ON chapters.formation_id = formations.id
      WHERE lessons.id = exercises.lesson_id AND formations.is_published = true
    )
  );

-- Politique pour les utilisateurs anonymes (lecture seule pour les exercices des leçons publiées)
CREATE POLICY anon_exercises_read_policy ON public.exercises
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.chapters ON lessons.chapter_id = chapters.id
      JOIN public.formations ON chapters.formation_id = formations.id
      WHERE lessons.id = exercises.lesson_id AND formations.is_published = true
    )
  );

-- Création de la table des tentatives d'exercices
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout des politiques RLS pour les tentatives d'exercices
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (CRUD complet)
CREATE POLICY admin_exercise_attempts_policy ON public.exercise_attempts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Politique pour les utilisateurs (lecture et insertion pour leurs propres tentatives)
CREATE POLICY users_exercise_attempts_policy ON public.exercise_attempts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Fonction pour récupérer les tentatives d'exercices d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_exercise_attempts(lesson_id_param UUID)
RETURNS SETOF public.exercise_attempts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.exercise_attempts
  WHERE user_id = auth.uid() AND lesson_id = lesson_id_param
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;