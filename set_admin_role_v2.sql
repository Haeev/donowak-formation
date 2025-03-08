-- Script amélioré pour définir loic.nowakowski@gmail.com comme administrateur
-- Exécutez ce script directement dans l'éditeur SQL de l'interface Supabase
-- Cette version vérifie d'abord les colonnes existantes

DO $$
DECLARE
    admin_email TEXT := 'loic.nowakowski@gmail.com';
    admin_id UUID;
    has_created_at BOOLEAN;
    has_updated_at BOOLEAN;
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
    
    -- Vérifier quelles colonnes existent
    SELECT 
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') as has_created_at,
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') as has_updated_at
    INTO 
        has_created_at,
        has_updated_at;
    
    -- Vérifier que l'utilisateur a un profil
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_id) THEN
        -- Insérer de manière conditionnelle selon les colonnes disponibles
        IF has_created_at AND has_updated_at THEN
            -- Toutes les colonnes temporelles existent
            INSERT INTO profiles (id, created_at, updated_at)
            VALUES (admin_id, NOW(), NOW());
        ELSIF has_created_at THEN
            -- Seulement created_at existe
            INSERT INTO profiles (id, created_at)
            VALUES (admin_id, NOW());
        ELSIF has_updated_at THEN
            -- Seulement updated_at existe
            INSERT INTO profiles (id, updated_at)
            VALUES (admin_id, NOW());
        ELSE
            -- Juste l'id
            INSERT INTO profiles (id)
            VALUES (admin_id);
        END IF;
        
        RAISE NOTICE 'Profil créé pour % avec les colonnes disponibles', admin_email;
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