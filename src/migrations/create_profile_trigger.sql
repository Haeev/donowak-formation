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
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour créer automatiquement un profil lorsqu'un nouvel utilisateur s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  demo_formation_id UUID;
BEGIN
  -- Créer le profil utilisateur
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  
  -- Récupérer une formation de démonstration pour l'attribuer automatiquement à l'utilisateur
  SELECT id INTO demo_formation_id FROM public.formations WHERE price = 0 LIMIT 1;
  
  -- Si une formation de démonstration existe, l'attribuer à l'utilisateur
  IF demo_formation_id IS NOT NULL THEN
    INSERT INTO public.user_formations (user_id, formation_id, purchased_at, price_paid)
    VALUES (NEW.id, demo_formation_id, NOW(), 0);
    
    -- Récupérer les leçons de cette formation et initialiser la progression
    FOR lesson_id IN (
      SELECT l.id FROM public.lessons l
      JOIN public.chapters c ON l.chapter_id = c.id
      WHERE c.formation_id = demo_formation_id
    )
    LOOP
      INSERT INTO public.user_progress (user_id, lesson_id, completed, last_accessed)
      VALUES (NEW.id, lesson_id, FALSE, NOW());
    END LOOP;
  END IF;
  
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
  COALESCE(raw_user_meta_data->>'full_name', email), 
  NOW(), 
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Créer des données de démonstration pour les formations
DO $$
DECLARE
  demo_formation_id UUID;
  chapter_id UUID;
  lesson_id UUID;
  user_id UUID;
BEGIN
  -- Vérifier si la table formations existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'formations') THEN
    -- Vérifier s'il n'y a pas de formations
    IF (SELECT COUNT(*) FROM public.formations) = 0 THEN
      -- Créer quelques formations de démonstration
      INSERT INTO public.formations (id, title, description, price, published, created_at, updated_at, image_url)
      VALUES 
        (gen_random_uuid(), 'Introduction au développement web', 'Apprenez les bases du HTML, CSS et JavaScript pour créer vos premières pages web interactives. Cette formation couvre les fondamentaux pour devenir développeur web.', 0, true, NOW(), NOW(), NULL),
        (gen_random_uuid(), 'React pour les débutants', 'Maîtrisez React et créez des applications web modernes avec la bibliothèque JavaScript la plus populaire. Apprenez à créer des interfaces utilisateur réactives et performantes.', 49.99, true, NOW(), NOW(), NULL),
        (gen_random_uuid(), 'Design UX/UI avancé', 'Créez des interfaces utilisateur exceptionnelles en apprenant les principes de conception UX/UI. Cette formation vous permettra de concevoir des expériences utilisateur intuitives et esthétiques.', 79.99, true, NOW(), NOW(), NULL)
      RETURNING id INTO demo_formation_id;
      
      -- Créer des chapitres et des leçons pour la formation gratuite
      FOR demo_formation_id IN (SELECT id FROM public.formations WHERE price = 0)
      LOOP
        -- Créer des chapitres
        INSERT INTO public.chapters (id, formation_id, title, description, position, created_at, updated_at)
        VALUES
          (gen_random_uuid(), demo_formation_id, 'Introduction au HTML', 'Découvrez les bases du HTML pour structurer vos pages web', 1, NOW(), NOW()),
          (gen_random_uuid(), demo_formation_id, 'Styles avec CSS', 'Apprenez à styliser vos pages avec CSS', 2, NOW(), NOW()),
          (gen_random_uuid(), demo_formation_id, 'Introduction à JavaScript', 'Les bases de la programmation web avec JavaScript', 3, NOW(), NOW())
        RETURNING id INTO chapter_id;
        
        -- Pour chaque chapitre, créer des leçons
        FOR chapter_id IN (SELECT id FROM public.chapters WHERE formation_id = demo_formation_id)
        LOOP
          -- Créer des leçons pour ce chapitre
          INSERT INTO public.lessons (id, chapter_id, title, content, position, duration, created_at, updated_at)
          VALUES
            (gen_random_uuid(), chapter_id, 'Leçon 1: Les bases', 'Contenu de la leçon sur les bases...', 1, 15, NOW(), NOW()),
            (gen_random_uuid(), chapter_id, 'Leçon 2: Concepts avancés', 'Contenu de la leçon sur les concepts avancés...', 2, 20, NOW(), NOW()),
            (gen_random_uuid(), chapter_id, 'Leçon 3: Mise en pratique', 'Contenu de la leçon sur la mise en pratique...', 3, 25, NOW(), NOW())
          RETURNING id INTO lesson_id;
        END LOOP;
      END LOOP;
      
      -- Attribuer la formation gratuite à tous les utilisateurs existants
      FOR user_id IN (SELECT id FROM auth.users)
      LOOP
        -- Vérifier si l'utilisateur a déjà cette formation
        IF NOT EXISTS (
          SELECT 1 FROM public.user_formations 
          WHERE user_id = user_id AND formation_id = demo_formation_id
        ) THEN
          -- Attribuer la formation gratuite
          INSERT INTO public.user_formations (user_id, formation_id, purchased_at, price_paid)
          VALUES (user_id, demo_formation_id, NOW(), 0);
          
          -- Initialiser la progression pour chaque leçon
          FOR lesson_id IN (
            SELECT l.id FROM public.lessons l
            JOIN public.chapters c ON l.chapter_id = c.id
            WHERE c.formation_id = demo_formation_id
          )
          LOOP
            INSERT INTO public.user_progress (user_id, lesson_id, completed, last_accessed)
            VALUES (user_id, lesson_id, FALSE, NOW());
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END IF;
END
$$; 