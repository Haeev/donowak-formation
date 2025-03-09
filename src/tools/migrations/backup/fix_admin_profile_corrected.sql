-- Script corrigé pour nettoyer et configurer le profil administrateur
-- Adapté pour vérifier les colonnes existantes avant insertion/mise à jour

-- Variables
DO $$
DECLARE
    target_user_id UUID := 'da384462-21b3-4e8d-b1e3-0187aea9d2bc'; -- ID de loic.nowakowski@gmail.com
    target_email TEXT := 'loic.nowakowski@gmail.com';
    profile_count INT;
    existing_profile_id UUID;
    has_email_column BOOLEAN;
    has_username_column BOOLEAN;
    has_full_name_column BOOLEAN;
    has_role_column BOOLEAN;
    insert_columns TEXT := 'id';
    insert_values TEXT := 'target_user_id';
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
    
    -- 3. Vérifier les colonnes disponibles dans la table profiles
    RAISE NOTICE 'Vérification de la structure de la table profiles...';
    
    -- Vérifier si la colonne email existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) INTO has_email_column;
    
    -- Vérifier si la colonne username existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) INTO has_username_column;
    
    -- Vérifier si la colonne full_name existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) INTO has_full_name_column;
    
    -- Vérifier si la colonne role existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) INTO has_role_column;
    
    -- 4. Ajouter la colonne role si elle n'existe pas
    IF NOT has_role_column THEN
        RAISE NOTICE 'Ajout de la colonne role à la table profiles...';
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
        has_role_column := TRUE;
        RAISE NOTICE 'Colonne role ajoutée.';
    END IF;
    
    -- 5. Construire dynamiquement la requête d'insertion/mise à jour
    -- Ajouter les colonnes qui existent
    IF has_email_column THEN
        insert_columns := insert_columns || ', email';
        insert_values := insert_values || ', target_email';
    END IF;
    
    IF has_username_column THEN
        insert_columns := insert_columns || ', username';
        insert_values := insert_values || ', target_email';
    END IF;
    
    IF has_full_name_column THEN
        insert_columns := insert_columns || ', full_name';
        insert_values := insert_values || ', ''Admin User''';
    END IF;
    
    IF has_role_column THEN
        insert_columns := insert_columns || ', role';
        insert_values := insert_values || ', ''admin''';
    END IF;
    
    -- Ajouter toujours created_at et updated_at (présents dans toutes les tables Supabase)
    insert_columns := insert_columns || ', created_at, updated_at';
    insert_values := insert_values || ', now(), now()';
    
    -- 6. Mettre à jour ou créer le profil administrateur
    IF profile_count > 0 THEN
        -- Mettre à jour le profil existant
        RAISE NOTICE 'Mise à jour du profil existant avec le rôle admin...';
        
        IF has_role_column THEN
            EXECUTE 'UPDATE public.profiles SET role = ''admin'', updated_at = now() WHERE id = $1' 
            USING target_user_id;
            RAISE NOTICE 'Profil mis à jour avec succès.';
        ELSE
            RAISE NOTICE 'Impossible de mettre à jour le rôle car la colonne n''existe pas.';
        END IF;
    ELSE
        -- Créer un nouveau profil avec les colonnes disponibles
        RAISE NOTICE 'Création d''un nouveau profil avec le rôle admin...';
        RAISE NOTICE 'Colonnes utilisées: %', insert_columns;
        
        EXECUTE format('
            INSERT INTO public.profiles (%s) 
            VALUES (%s)
        ', insert_columns, insert_values);
        
        RAISE NOTICE 'Nouveau profil créé avec succès.';
    END IF;
    
    -- 7. Vérifier le résultat final
    RAISE NOTICE 'Vérification du profil final...';
    
    IF has_role_column THEN
        SELECT id INTO existing_profile_id 
        FROM public.profiles 
        WHERE id = target_user_id AND role = 'admin';
        
        IF existing_profile_id IS NOT NULL THEN
            RAISE NOTICE 'Configuration réussie! L''utilisateur % est maintenant administrateur.', target_email;
            RAISE NOTICE 'Vous pouvez maintenant vous déconnecter et vous reconnecter pour accéder au dashboard admin.';
        ELSE
            RAISE NOTICE 'Erreur: Impossible de configurer le profil administrateur pour %', target_email;
        END IF;
    ELSE
        RAISE NOTICE 'Impossible de vérifier le rôle car la colonne n''existe pas.';
    END IF;
END $$;

-- Vérification finale (pour afficher le résultat)
SELECT id, email, role
FROM public.profiles
WHERE id = 'da384462-21b3-4e8d-b1e3-0187aea9d2bc'; 