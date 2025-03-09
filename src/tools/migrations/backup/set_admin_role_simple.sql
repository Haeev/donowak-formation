-- Script simplifié pour définir loic.nowakowski@gmail.com comme administrateur
-- Ce script suppose que le profil existe déjà et se concentre uniquement sur l'ajout de la colonne role et la mise à jour du rôle

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
    
    -- Vérifier si la colonne role existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        -- Ajouter la colonne role si nécessaire
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        
        RAISE NOTICE 'Colonne role ajoutée à la table profiles';
    END IF;
    
    -- Mettre à jour le rôle en admin directement
    UPDATE profiles SET role = 'admin' WHERE id = admin_id;
    
    -- Vérifier si la mise à jour a été effectuée
    IF FOUND THEN
        RAISE NOTICE 'Utilisateur % promu administrateur avec succès', admin_email;
    ELSE
        RAISE EXCEPTION 'Profil non trouvé pour l''utilisateur %. Veuillez d''abord créer un profil.', admin_email;
    END IF;
END $$; 