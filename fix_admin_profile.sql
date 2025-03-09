-- Script pour nettoyer et corriger le profil administrateur de loic.nowakowski@gmail.com
-- À exécuter dans la console SQL de Supabase

-- Variables
DO $$
DECLARE
    target_user_id UUID := 'da384462-21b3-4e8d-b1e3-0187aea9d2bc'; -- ID de loic.nowakowski@gmail.com
    target_email TEXT := 'loic.nowakowski@gmail.com';
    profile_count INT;
    existing_profile_id UUID;
BEGIN
    -- 1. Analyser l'état actuel des profils
    RAISE NOTICE 'Analyse des profils pour l''utilisateur %', target_email;
    
    -- Vérifier combien de profils existent
    SELECT COUNT(*) INTO profile_count 
    FROM public.profiles 
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Nombre de profils trouvés: %', profile_count;
    
    -- 2. Nettoyer les profils existants si nécessaire
    IF profile_count > 1 THEN
        RAISE NOTICE 'Plusieurs profils détectés. Suppression des doublons...';
        
        -- Garder un seul profil (le plus récent) et supprimer les autres
        WITH latest_profile AS (
            SELECT id FROM public.profiles 
            WHERE id = target_user_id 
            ORDER BY updated_at DESC LIMIT 1
        )
        DELETE FROM public.profiles 
        WHERE id = target_user_id AND id NOT IN (SELECT id FROM latest_profile);
        
        RAISE NOTICE 'Doublons supprimés.';
    ELSIF profile_count = 0 THEN
        RAISE NOTICE 'Aucun profil trouvé pour cet utilisateur.';
    ELSE
        RAISE NOTICE 'Un seul profil trouvé, pas de nettoyage nécessaire.';
    END IF;
    
    -- 3. Vérifier si la colonne role existe, l'ajouter si nécessaire
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne role à la table profiles...';
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Colonne role ajoutée.';
    END IF;
    
    -- 4. Mettre à jour ou créer le profil administrateur
    IF profile_count > 0 THEN
        -- Mettre à jour le profil existant
        RAISE NOTICE 'Mise à jour du profil existant avec le rôle admin...';
        
        UPDATE public.profiles 
        SET role = 'admin', 
            updated_at = now() 
        WHERE id = target_user_id;
        
        RAISE NOTICE 'Profil mis à jour avec succès.';
    ELSE
        -- Créer un nouveau profil
        RAISE NOTICE 'Création d''un nouveau profil avec le rôle admin...';
        
        INSERT INTO public.profiles (
            id, 
            email,
            username, 
            full_name, 
            role, 
            created_at, 
            updated_at
        ) 
        VALUES (
            target_user_id, 
            target_email,
            target_email, 
            'Admin User', 
            'admin', 
            now(), 
            now()
        );
        
        RAISE NOTICE 'Nouveau profil créé avec succès.';
    END IF;
    
    -- 5. Vérifier le résultat final
    RAISE NOTICE 'Vérification du profil final...';
    
    SELECT id INTO existing_profile_id 
    FROM public.profiles 
    WHERE id = target_user_id AND role = 'admin';
    
    IF existing_profile_id IS NOT NULL THEN
        RAISE NOTICE 'Configuration réussie! L''utilisateur % est maintenant administrateur.', target_email;
        RAISE NOTICE 'Vous pouvez maintenant vous déconnecter et vous reconnecter pour accéder au dashboard admin.';
    ELSE
        RAISE NOTICE 'Erreur: Impossible de configurer le profil administrateur pour %', target_email;
    END IF;
END $$;

-- Vérification finale (pour afficher le résultat)
SELECT id, email, role, username, full_name, created_at, updated_at
FROM public.profiles
WHERE id = 'da384462-21b3-4e8d-b1e3-0187aea9d2bc'; 