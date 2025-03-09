-- Script pour définir loic.nowakowski@gmail.com comme administrateur
-- Exécutez ce script directement dans l'éditeur SQL de l'interface Supabase

-- Récupérer l'ID de l'utilisateur
DO $$
DECLARE
    admin_email TEXT := 'loic.nowakowski@gmail.com';
    admin_id UUID;
BEGIN
    -- Trouver l'utilisateur par email
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- Vérifier si l'utilisateur existe
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé', admin_email;
    END IF;
    
    -- Vérifier si la table profiles existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'La table profiles n''existe pas';
    END IF;
    
    -- Vérifier que l'utilisateur a un profil
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id) THEN
        -- Créer un profil avec seulement l'id (sans username et full_name qui n'existent pas)
        INSERT INTO profiles (id)
        VALUES (admin_id);
        
        RAISE NOTICE 'Profil créé pour %', admin_email;
    END IF;
    
    -- Vérifier si la colonne role existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        -- Ajouter la colonne role si nécessaire
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        
        RAISE NOTICE 'Colonne role ajoutée à la table profiles';
    END IF;
    
    -- Mettre à jour le rôle en admin
    UPDATE profiles SET role = 'admin' WHERE id = admin_id;
    
    RAISE NOTICE 'Utilisateur % promu administrateur avec succès', admin_email;
END $$; 