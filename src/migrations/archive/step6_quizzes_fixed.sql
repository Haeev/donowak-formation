-- Étape 6 : Création des tables pour les quiz et tentatives

-- Vérifier si la table quizzes actuelle a la structure attendue
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Vérifier si la colonne lesson_id existe dans la table quizzes
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quizzes' 
        AND column_name = 'lesson_id'
    ) INTO column_exists;

    -- Si la table existe mais pas la colonne, on modifie la table
    IF NOT column_exists AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quizzes'
    ) THEN
        -- Ajouter la colonne lesson_id
        ALTER TABLE public.quizzes 
        ADD COLUMN lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Colonne lesson_id ajoutée à la table quizzes existante';
    END IF;
END
$$;

-- Création de la table quizzes si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches (seulement si la table a la colonne lesson_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quizzes' 
        AND column_name = 'lesson_id'
    ) THEN
        -- Création de l'index sur lesson_id
        CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);
    END IF;
END
$$;

-- Politique RLS pour quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Suppression de politiques existantes si nécessaire
DO $$
BEGIN
    -- Supprimer la politique si elle existe déjà
    IF EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'quizzes' 
        AND policyname = 'Tout le monde peut voir les quiz des formations publiées'
    ) THEN
        DROP POLICY "Tout le monde peut voir les quiz des formations publiées" ON public.quizzes;
    END IF;
END
$$;

-- Politique pour les quiz - seulement si la colonne lesson_id existe
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quizzes' 
        AND column_name = 'lesson_id'
    ) THEN
        -- Création de la politique
        CREATE POLICY "Tout le monde peut voir les quiz des formations publiées" 
        ON public.quizzes FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.lessons
            JOIN public.chapters ON lessons.chapter_id = chapters.id
            JOIN public.formations ON chapters.formation_id = formations.id
            WHERE lessons.id = quizzes.lesson_id
            AND formations.published = TRUE
          )
        );
    END IF;
END
$$;

-- Table des tentatives de quiz
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_id)
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);

-- Politique RLS pour quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Politique pour les tentatives de quiz
CREATE POLICY "Les utilisateurs peuvent voir et créer leurs propres tentatives" 
ON public.quiz_attempts FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent voir toutes les tentatives" 
ON public.quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 