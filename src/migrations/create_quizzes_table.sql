-- Script de création de la table quizzes et configuration des politiques

-- Création de la table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  quiz_data JSONB NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Création des index
CREATE INDEX IF NOT EXISTS quizzes_user_id_idx ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS quizzes_category_idx ON quizzes(category);

-- Activation de RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Les admins peuvent tout faire
DROP POLICY IF EXISTS quizzes_admin_policy ON quizzes;
CREATE POLICY quizzes_admin_policy ON quizzes
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Les utilisateurs peuvent voir tous les quiz
DROP POLICY IF EXISTS quizzes_select_policy ON quizzes;
CREATE POLICY quizzes_select_policy ON quizzes
  FOR SELECT USING (true);

-- Déclencheur pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON quizzes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 