-- Créer la table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  job_title TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour créer automatiquement un profil lorsqu'un nouvel utilisateur s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le déclencheur s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le déclencheur pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insérer des profils pour les utilisateurs existants qui n'en ont pas encore
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  NOW(), 
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Créer des données de démonstration pour les formations
DO $$
DECLARE
  demo_formation_id UUID;
BEGIN
  -- Vérifier si la table formations existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'formations') THEN
    -- Vérifier s'il n'y a pas de formations
    IF (SELECT COUNT(*) FROM public.formations) = 0 THEN
      -- Créer quelques formations de démonstration
      INSERT INTO public.formations (id, title, description, price, published, created_at, updated_at, image_url)
      VALUES 
        (gen_random_uuid(), 'Introduction au développement web', 'Apprenez les bases du HTML, CSS et JavaScript', 0, true, NOW(), NOW(), NULL),
        (gen_random_uuid(), 'React pour les débutants', 'Maîtrisez React et créez des applications web modernes', 49.99, true, NOW(), NOW(), NULL),
        (gen_random_uuid(), 'Design UX/UI avancé', 'Créez des interfaces utilisateur exceptionnelles', 79.99, true, NOW(), NOW(), NULL)
      RETURNING id INTO demo_formation_id;
    END IF;
  END IF;
END
$$; 