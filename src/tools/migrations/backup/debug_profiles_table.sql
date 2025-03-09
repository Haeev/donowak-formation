-- Script de diagnostic pour examiner la structure de la table profiles
-- Exécutez ce script avant de tenter de promouvoir un utilisateur en administrateur

-- Afficher les informations sur la table profiles
SELECT 
    table_schema, 
    table_name
FROM 
    information_schema.tables 
WHERE 
    table_name = 'profiles';

-- Afficher toutes les colonnes de la table profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'profiles'
ORDER BY 
    ordinal_position;

-- Afficher le nombre de profils existants
SELECT COUNT(*) as nombre_profils FROM profiles;

-- Afficher l'id d'un utilisateur spécifique (à des fins de test)
SELECT id FROM auth.users WHERE email = 'loic.nowakowski@gmail.com';

-- Afficher les clés primaires si elles existent
SELECT
    c.column_name,
    c.data_type,
    c.table_name
FROM
    information_schema.table_constraints tc 
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) 
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
    AND tc.table_name = c.table_name
    AND ccu.column_name = c.column_name
WHERE 
    tc.constraint_type = 'PRIMARY KEY' AND
    tc.table_name = 'profiles'; 