-- Ajouter la colonne is_deleted à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne deleted_at à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Ajouter les colonnes phone et bio à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Créer un index sur la colonne is_deleted pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);

-- Créer une fonction RLS pour vérifier si un utilisateur est supprimé
CREATE OR REPLACE FUNCTION auth.check_user_not_deleted()
RETURNS boolean AS $$
BEGIN
  -- Vérifier si l'utilisateur est marqué comme supprimé dans la table profiles
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_deleted = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les politiques RLS pour empêcher les utilisateurs supprimés d'accéder aux données
DO $$
BEGIN
  -- Vérifier si la politique existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'prevent_deleted_users_access'
  ) THEN
    -- Créer une politique pour empêcher les utilisateurs supprimés d'accéder à leurs données
    CREATE POLICY prevent_deleted_users_access ON public.profiles
      USING (auth.check_user_not_deleted());
  END IF;
END
$$; 