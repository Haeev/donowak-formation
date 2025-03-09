-- Script pour vérifier le statut administrateur de l'utilisateur loic.nowakowski@gmail.com
-- À exécuter dans la console SQL de Supabase

-- 1. Vérifier si l'utilisateur existe dans auth.users
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'loic.nowakowski@gmail.com';

-- 2. Vérifier si l'utilisateur a un profil dans la table profiles
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'loic.nowakowski@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'Utilisateur avec email loic.nowakowski@gmail.com non trouvé';
        RETURN;
    END IF;
    
    -- Vérifier si un profil existe
    IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
        RAISE NOTICE 'Profil trouvé pour loic.nowakowski@gmail.com';
    ELSE
        RAISE NOTICE 'Aucun profil trouvé pour loic.nowakowski@gmail.com';
    END IF;
END $$;

-- 3. Vérifier le rôle de l'utilisateur
WITH user_info AS (
    SELECT id 
    FROM auth.users 
    WHERE email = 'loic.nowakowski@gmail.com'
)
SELECT p.id, p.role, p.* 
FROM profiles p
JOIN user_info u ON p.id = u.id;

-- 4. Mettre à jour le rôle en admin si nécessaire
DO $$
DECLARE
    user_id UUID;
    current_role TEXT;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'loic.nowakowski@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'Utilisateur avec email loic.nowakowski@gmail.com non trouvé';
        RETURN;
    END IF;
    
    -- Vérifier le rôle actuel
    SELECT role INTO current_role 
    FROM profiles 
    WHERE id = user_id;
    
    -- Afficher le rôle actuel
    RAISE NOTICE 'Rôle actuel de l''utilisateur: %', current_role;
    
    -- Mettre à jour le rôle en admin si ce n'est pas déjà le cas
    IF current_role IS NULL OR current_role != 'admin' THEN
        -- D'abord vérifier si la colonne role existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'profiles' AND column_name = 'role') THEN
            -- Ajouter la colonne role si elle n'existe pas
            ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
            RAISE NOTICE 'Colonne role ajoutée à la table profiles';
        END IF;
        
        -- Mettre à jour le rôle
        UPDATE profiles 
        SET role = 'admin' 
        WHERE id = user_id;
        
        RAISE NOTICE 'Rôle mis à jour à admin pour l''utilisateur loic.nowakowski@gmail.com';
    ELSE
        RAISE NOTICE 'L''utilisateur loic.nowakowski@gmail.com est déjà administrateur';
    END IF;
END $$; 