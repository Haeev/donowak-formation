-- Script de diagnostic détaillé pour l'utilisateur loic.nowakowski@gmail.com

-- 1. Vérifier l'ID de l'utilisateur dans auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'loic.nowakowski@gmail.com';

-- 2. Vérifier les profils existants dans la table profiles 
SELECT * FROM profiles LIMIT 10;

-- 3. Vérifier spécifiquement si un profil existe pour cet utilisateur
DO $$
DECLARE
    user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO user_id FROM auth.users WHERE email = 'loic.nowakowski@gmail.com';
    
    -- Afficher l'ID trouvé
    RAISE NOTICE 'ID de l''utilisateur: %', user_id;
    
    -- Vérifier si un profil existe avec cet ID
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
    
    -- Afficher le résultat
    IF profile_exists THEN
        RAISE NOTICE 'Un profil existe pour cet utilisateur';
    ELSE
        RAISE NOTICE 'Aucun profil n''existe pour cet utilisateur';
    END IF;
END $$;

-- 4. Vérifier le schéma de la table profiles
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'profiles'
ORDER BY 
    ordinal_position;

-- 5. Lister toutes les tables du schéma public pour voir s'il y a d'autres tables pertinentes
SELECT 
    table_name
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;

-- 6. Vérifier si le profil pourrait être dans une autre table
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO user_id FROM auth.users WHERE email = 'loic.nowakowski@gmail.com';
    
    -- Afficher les tables qui pourraient contenir cet ID
    RAISE NOTICE 'Tables susceptibles de contenir l''ID utilisateur:';
    
    -- Ce bloc est commenté car il utilise une syntaxe qui pourrait ne pas être supportée
    -- dans toutes les versions PostgreSQL. Décommentez si nécessaire.
    /*
    FOR tab_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE id = ''%s''', tab_name, user_id) INTO cnt;
        IF cnt > 0 THEN
            RAISE NOTICE '  Table %: % occurrences', tab_name, cnt;
        END IF;
    END LOOP;
    */
END $$; 