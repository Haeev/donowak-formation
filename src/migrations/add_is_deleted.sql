-- Ajouter la colonne is_deleted à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE; 