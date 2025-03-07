-- Ajouter la colonne is_deleted à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne deleted_at à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Ajouter les colonnes phone et bio à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Créer un index sur la colonne is_deleted pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted); 