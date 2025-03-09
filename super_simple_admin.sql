-- Script SQL ultra-simple pour définir loic.nowakowski@gmail.com comme administrateur
-- À exécuter directement dans la console SQL de Supabase

-- Étape 1 : S'assurer que la colonne role existe
DO $$
BEGIN
    -- Vérifier si la colonne role existe déjà
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        -- Ajouter la colonne role
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Colonne role ajoutée à la table profiles';
    END IF;
END $$;

-- Étape 2 : Mettre à jour le rôle pour l'utilisateur trouvé par email
UPDATE profiles 
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'loic.nowakowski@gmail.com'
);

-- Étape 3 : Vérifier le résultat
SELECT 
    au.email, 
    p.role,
    CASE WHEN p.role = 'admin' THEN 'Rôle administrateur configuré avec succès' 
         ELSE 'Échec de la configuration du rôle administrateur' 
    END as statut
FROM 
    auth.users au
JOIN 
    profiles p ON au.id = p.id
WHERE 
    au.email = 'loic.nowakowski@gmail.com'; 