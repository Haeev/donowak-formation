-- 1. Répertorier toutes les politiques existantes sur la table users
DO $$
BEGIN
  RAISE NOTICE 'Politiques actuelles sur la table users:';
END $$;

SELECT * FROM pg_policies WHERE tablename = 'users';

-- 2. Supprimer toutes les politiques problématiques qui causent la récursion infinie
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- 3. Recréer les politiques correctement pour éviter la récursion
-- Politique permettant aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Politique permettant aux administrateurs de voir tous les utilisateurs (utilise profiles au lieu de users)
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Politique permettant aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Politique permettant aux administrateurs de mettre à jour tous les utilisateurs
CREATE POLICY "Admins can update all users" ON public.users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Vérifier que les nouvelles politiques ont été créées correctement
DO $$
BEGIN
  RAISE NOTICE 'Nouvelles politiques sur la table users:';
END $$;

SELECT * FROM pg_policies WHERE tablename = 'users'; 