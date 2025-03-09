-- Ajouter un champ de rôle à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Créer un enum pour les rôles si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
        
        -- Migration des colonnes existantes
        ALTER TABLE profiles 
        ALTER COLUMN role TYPE user_role USING role::user_role;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour promouvoir un utilisateur en administrateur
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INT;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Mettre à jour le rôle
    UPDATE profiles 
    SET role = 'admin' 
    WHERE id = target_user_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rétrograder un administrateur en utilisateur standard
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INT;
BEGIN
    -- Vérifier que l'utilisateur existe et est un administrateur
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND role = 'admin') THEN
        RETURN FALSE;
    END IF;
    
    -- Mettre à jour le rôle
    UPDATE profiles 
    SET role = 'user' 
    WHERE id = target_user_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialiser un administrateur par défaut si aucun n'existe
-- Configuré pour promouvoir loic.nowakowski@gmail.com comme administrateur
DO $$
DECLARE
    admin_email TEXT := 'loic.nowakowski@gmail.com';
    admin_id UUID;
BEGIN
    -- Vérifier s'il existe déjà un administrateur
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
        -- Trouver l'utilisateur par email
        SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
        
        -- Si l'utilisateur existe, le promouvoir comme administrateur
        IF admin_id IS NOT NULL THEN
            UPDATE profiles SET role = 'admin' WHERE id = admin_id;
            RAISE NOTICE 'Utilisateur % promu administrateur', admin_email;
        ELSE
            RAISE NOTICE 'Aucun utilisateur trouvé avec l''email %', admin_email;
        END IF;
    END IF;
END $$; 