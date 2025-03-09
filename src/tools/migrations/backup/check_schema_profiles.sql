-- Script pour vérifier les schémas et définir un administrateur
-- Ce script vérifie tous les schémas pour trouver la table profiles

DO $$
DECLARE
    admin_email TEXT := 'loic.nowakowski@gmail.com';
    admin_id UUID;
    schema_name TEXT;
    found_schema TEXT := NULL;
    query TEXT;
    profile_exists BOOLEAN;
    current_role TEXT;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- Vérifier si l'utilisateur existe
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé', admin_email;
    END IF;
    
    -- Afficher l'ID à des fins de débogage
    RAISE NOTICE 'ID utilisateur: %', admin_id;
    
    -- 1. Vérifier tous les schémas pour trouver la table profiles
    FOR schema_name IN 
        SELECT nspname FROM pg_namespace
        WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'
    LOOP
        -- Vérifier si profiles existe dans ce schéma
        PERFORM 1
        FROM information_schema.tables
        WHERE table_schema = schema_name AND table_name = 'profiles';
        
        IF FOUND THEN
            found_schema := schema_name;
            RAISE NOTICE 'Table profiles trouvée dans le schéma: %', found_schema;
        END IF;
    END LOOP;
    
    -- Si aucun schéma n'est trouvé, lever une exception
    IF found_schema IS NULL THEN
        RAISE EXCEPTION 'Table profiles introuvable dans tous les schémas';
    END IF;
    
    -- 2. Vérifier si l'utilisateur a un profil dans ce schéma
    query := format('SELECT EXISTS(SELECT 1 FROM %I.profiles WHERE id = %L)', found_schema, admin_id);
    EXECUTE query INTO STRICT profile_exists;
    
    RAISE NOTICE 'Profil existe dans schéma %: %', found_schema, profile_exists;
    
    -- 3. Vérifier si la colonne role existe dans ce schéma
    PERFORM 1
    FROM information_schema.columns
    WHERE table_schema = found_schema
      AND table_name = 'profiles'
      AND column_name = 'role';
    
    -- Ajouter la colonne si elle n'existe pas
    IF NOT FOUND THEN
        query := format('ALTER TABLE %I.profiles ADD COLUMN role TEXT DEFAULT ''user''', found_schema);
        EXECUTE query;
        RAISE NOTICE 'Colonne role ajoutée à %.profiles', found_schema;
    END IF;
    
    -- 4. Créer un profil si nécessaire
    IF NOT profile_exists THEN
        query := format('INSERT INTO %I.profiles (id, role) VALUES (%L, %L)', 
                       found_schema, admin_id, 'admin');
        EXECUTE query;
        RAISE NOTICE 'Profil créé dans %.profiles', found_schema;
    ELSE
        -- 5. Mettre à jour le rôle admin
        query := format('UPDATE %I.profiles SET role = %L WHERE id = %L', 
                       found_schema, 'admin', admin_id);
        EXECUTE query;
        RAISE NOTICE 'Profil mis à jour dans %.profiles', found_schema;
    END IF;
    
    -- 6. Vérification finale
    query := format('SELECT role FROM %I.profiles WHERE id = %L', found_schema, admin_id);
    EXECUTE query INTO STRICT current_role;
    
    RAISE NOTICE 'Rôle final de l''utilisateur: %', current_role;
    
    IF current_role = 'admin' THEN
        RAISE NOTICE 'SUCCÈS: L''utilisateur % est maintenant administrateur dans le schéma %', 
                    admin_email, found_schema;
    ELSE
        RAISE EXCEPTION 'Échec: Le rôle n''a pas été correctement défini à "admin"';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur: %', SQLERRM;
END $$; 