-- Script de force pour définir l'administrateur
-- Ce script utilise ON CONFLICT pour s'assurer que l'enregistrement est créé ou mis à jour

DO $$
DECLARE
    admin_email TEXT := 'loic.nowakowski@gmail.com';
    admin_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- Vérifier si l'utilisateur existe
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email % non trouvé', admin_email;
    END IF;
    
    -- Afficher l'ID à des fins de débogage
    RAISE NOTICE 'ID utilisateur: %', admin_id;
    
    -- 1. Vérifier si la colonne role existe et l'ajouter si nécessaire
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Colonne role ajoutée à la table profiles';
    END IF;
    
    -- 2. Tentative 1: Utiliser ON CONFLICT pour insérer ou mettre à jour
    BEGIN
        EXECUTE format('
            INSERT INTO profiles (id, role) 
            VALUES (%L, %L)
            ON CONFLICT (id) DO UPDATE SET role = %L
        ', admin_id, 'admin', 'admin');
        
        RAISE NOTICE 'Méthode 1 réussie: Utilisateur défini comme admin par ON CONFLICT';
        RETURN;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur avec ON CONFLICT: %', SQLERRM;
    END;
    
    -- 3. Tentative 2: UPDATE direct puis INSERT si non trouvé
    BEGIN
        -- Tenter une mise à jour directe
        UPDATE profiles SET role = 'admin' WHERE id = admin_id;
        
        IF FOUND THEN
            RAISE NOTICE 'Méthode 2 réussie: Utilisateur existant défini comme admin par UPDATE';
            RETURN;
        ELSE
            -- Si non trouvé, tenter une insertion
            RAISE NOTICE 'Profil non trouvé, tentative d''insertion...';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur avec UPDATE: %', SQLERRM;
    END;
    
    -- 4. Tentative 3: Insertion simple
    BEGIN
        INSERT INTO profiles (id, role) VALUES (admin_id, 'admin');
        RAISE NOTICE 'Méthode 3 réussie: Profil créé et défini comme admin par INSERT';
        RETURN;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur avec INSERT simple: %', SQLERRM;
    END;
    
    -- 5. Tentative 4: Mise à jour directe en SQL brut
    BEGIN
        EXECUTE format('UPDATE profiles SET role = ''admin'' WHERE id = ''%s''', admin_id);
        RAISE NOTICE 'Méthode 4 réussie: Mise à jour directe via EXECUTE';
        RETURN;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur avec EXECUTE UPDATE: %', SQLERRM;
    END;
    
    -- Si nous arrivons ici, toutes les tentatives ont échoué
    RAISE EXCEPTION 'Impossible de définir l''utilisateur comme admin après plusieurs tentatives';
END $$; 