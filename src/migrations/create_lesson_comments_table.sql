-- Création de la table de commentaires pour les leçons
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  is_flagged BOOLEAN DEFAULT false NOT NULL,
  flag_reason TEXT
);

-- Ajout d'un index pour accélérer les recherches par lesson_id
CREATE INDEX idx_lesson_comments_lesson_id ON public.lesson_comments(lesson_id);

-- Ajout d'un index pour accélérer les recherches par user_id
CREATE INDEX idx_lesson_comments_user_id ON public.lesson_comments(user_id);

-- Ajout d'un index pour les commentaires parents/enfants
CREATE INDEX idx_lesson_comments_parent_id ON public.lesson_comments(parent_id) WHERE parent_id IS NOT NULL;

-- Politiques RLS pour la table des commentaires
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les commentaires (tout le monde peut voir les commentaires approuvés)
CREATE POLICY "Les commentaires approuvés sont visibles par tous"
  ON public.lesson_comments
  FOR SELECT
  USING (is_approved = true AND is_deleted = false);

-- Politique de lecture pour les administrateurs (peuvent voir tous les commentaires)
CREATE POLICY "Les administrateurs peuvent voir tous les commentaires"
  ON public.lesson_comments
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de lecture pour les utilisateurs (peuvent voir leurs propres commentaires même non-approuvés)
CREATE POLICY "Les utilisateurs peuvent voir leurs propres commentaires"
  ON public.lesson_comments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique d'insertion pour les commentaires (les utilisateurs peuvent ajouter des commentaires)
CREATE POLICY "Les utilisateurs peuvent ajouter des commentaires"
  ON public.lesson_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour pour les administrateurs (peuvent mettre à jour tous les commentaires)
CREATE POLICY "Les administrateurs peuvent mettre à jour tous les commentaires"
  ON public.lesson_comments
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de mise à jour pour les utilisateurs (peuvent mettre à jour leurs propres commentaires non-approuvés)
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres commentaires non-approuvés"
  ON public.lesson_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND is_approved = false);

-- Politique de suppression pour les administrateurs (peuvent supprimer tous les commentaires)
CREATE POLICY "Les administrateurs peuvent supprimer tous les commentaires"
  ON public.lesson_comments
  FOR DELETE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de suppression pour les utilisateurs (suppression logique de leurs propres commentaires)
CREATE POLICY "Les utilisateurs peuvent supprimer logiquement leurs propres commentaires"
  ON public.lesson_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND is_deleted = false);

-- Ajout d'un trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION public.update_lesson_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_lesson_comments_updated_at(); 