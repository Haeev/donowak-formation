-- Script complet pour créer un profil et promouvoir au rôle administrateur
-- Pour l'utilisateur loic.nowakowski@gmail.com

DO $$
DECLARE
    admin_email TEXT := 'loic.nowakowski@gmail.com';
    admin_id UUID;
    profile_exists BOOLEAN;
    profile_count INT;
BEGIN
    -- 1. Récupérer l'ID de l'utilisateur
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- Vérifier si l'utilisateur existe
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé dans auth.users', admin_email;
    END IF;
    
    RAISE NOTICE 'ID utilisateur trouvé: %', admin_id;
    
    -- 2. Vérifier si la table profiles existe
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE EXCEPTION 'La table profiles n''existe pas dans le schéma public';
    END IF;
    
    -- 3. Vérifier si un profil existe déjà
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = admin_id) INTO profile_exists;
    
    -- 4. Compter le nombre total de profils
    SELECT COUNT(*) INTO profile_count FROM profiles;
    RAISE NOTICE 'Nombre total de profils: %', profile_count;
    
    -- 5. Créer un profil si nécessaire
    IF NOT profile_exists THEN
        RAISE NOTICE 'Aucun profil trouvé pour l''ID %. Tentative de création...', admin_id;
        
        -- Insertion simple avec seulement l'ID
        BEGIN
            INSERT INTO profiles (id) VALUES (admin_id);
            RAISE NOTICE 'Profil créé avec succès';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors de la création du profil: %', SQLERRM;
            
            -- Tentative alternative avec colonnes dynamiques
            DECLARE
                columns_list TEXT := 'id';
                values_list TEXT := quote_literal(admin_id);
            BEGIN
                -- Vérifier si created_at existe
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
                    columns_list := columns_list || ', created_at';
                    values_list := values_list || ', NOW()';
                END IF;
                
                -- Exécuter l'insertion dynamiquement
                EXECUTE format('INSERT INTO profiles (%s) VALUES (%s)', columns_list, values_list);
                RAISE NOTICE 'Profil créé avec colonnes dynamiques: %', columns_list;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Erreur lors de la création dynamique du profil: %', SQLERRM;
                RAISE EXCEPTION 'Impossible de créer un profil pour l''utilisateur';
            END;
        END;
    ELSE
        RAISE NOTICE 'Un profil existe déjà pour cet utilisateur';
    END IF;
    
    -- 6. Vérifier si la colonne role existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'role') THEN
        -- Ajouter la colonne role
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Colonne role ajoutée à la table profiles';
    END IF;
    
    -- 7. Mettre à jour le rôle en admin
    UPDATE profiles SET role = 'admin' WHERE id = admin_id;
    
    -- 8. Vérifier si la mise à jour a réussi
    IF FOUND THEN
        RAISE NOTICE 'Utilisateur % promu administrateur avec succès', admin_email;
    ELSE
        RAISE EXCEPTION 'Échec de la mise à jour du rôle. Vérifiez que le profil existe bien.';
    END IF;
    
    -- 9. Vérification finale
    DECLARE
        current_role TEXT;
    BEGIN
        SELECT role INTO current_role FROM profiles WHERE id = admin_id;
        RAISE NOTICE 'Rôle actuel de l''utilisateur: %', current_role;
        
        IF current_role = 'admin' THEN
            RAISE NOTICE 'SUCCÈS: L''utilisateur % est maintenant administrateur', admin_email;
        ELSE
            RAISE EXCEPTION 'Échec: Le rôle n''a pas été correctement défini à "admin"';
        END IF;
    END;
END $$; 