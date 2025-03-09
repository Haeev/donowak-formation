-- Script final corrigé pour définir l'utilisateur comme administrateur
-- À exécuter dans la console SQL de Supabase

-- 1. Ajouter la colonne role si elle n'existe pas encore
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    RAISE NOTICE 'Colonne role ajoutée à la table profiles';
  END IF;
END $$;

-- 2. Suppression des profils existants pour cet utilisateur
DELETE FROM public.profiles 
WHERE id = 'da384462-21b3-4e8d-b1e3-0187aea9d2bc';

-- 3. Création d'un nouveau profil avec les valeurs explicites
-- Inclusion de la colonne email obligatoire
INSERT INTO public.profiles (id, email, role, created_at, updated_at) 
VALUES (
  'da384462-21b3-4e8d-b1e3-0187aea9d2bc', -- ID explicite
  'loic.nowakowski@gmail.com',           -- Email obligatoire
  'admin',                               -- Rôle administrateur
  NOW(),                                 -- Date de création
  NOW()                                  -- Date de mise à jour
);

-- 4. Vérification du résultat
SELECT id, email, role
FROM public.profiles
WHERE id = 'da384462-21b3-4e8d-b1e3-0187aea9d2bc'; 