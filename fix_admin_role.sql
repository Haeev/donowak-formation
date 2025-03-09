-- Script SQL simplifié pour définir loic.nowakowski@gmail.com comme administrateur
-- À exécuter directement dans la console SQL de Supabase

-- Étape 1 : Obtenir l'ID de l'utilisateur
WITH user_id AS (
    SELECT id FROM auth.users WHERE email = 'loic.nowakowski@gmail.com'
)

-- Étape 2 : Insérer ou mettre à jour le profil
INSERT INTO profiles (id, email, role)
SELECT id, 'loic.nowakowski@gmail.com', 'admin' FROM user_id
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';

-- Étape 3 : Vérifier le résultat
SELECT 
    au.email, 
    p.role, 
    p.id = au.id AS id_match,
    'Utilisateur correctement configuré comme administrateur' AS status
FROM 
    profiles p
JOIN 
    auth.users au ON p.id = au.id
WHERE 
    au.email = 'loic.nowakowski@gmail.com'; 