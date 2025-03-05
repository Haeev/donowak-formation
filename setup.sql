-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create formations table
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  level TEXT CHECK (level IN ('débutant', 'intermédiaire', 'avancé')),
  duration INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  video_url TEXT,
  position INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_formations table (for purchases)
CREATE TABLE IF NOT EXISTS public.user_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  price_paid DECIMAL(10, 2) NOT NULL,
  UNIQUE(user_id, formation_id)
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  certificate_url TEXT,
  UNIQUE(user_id, formation_id)
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Formations policies
CREATE POLICY "Formations are viewable by everyone" 
ON public.formations FOR SELECT USING (true);

-- Chapters policies
CREATE POLICY "Chapters are viewable by everyone" 
ON public.chapters FOR SELECT USING (true);

-- Lessons policies
CREATE POLICY "Lessons are viewable by everyone" 
ON public.lessons FOR SELECT USING (true);

-- User formations policies
CREATE POLICY "Users can view their own purchases" 
ON public.user_formations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" 
ON public.user_formations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User progress policies
CREATE POLICY "Users can view their own progress" 
ON public.user_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "Users can view their own certificates" 
ON public.certificates FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, '', '');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample formations
INSERT INTO public.formations (id, title, description, price, image_url, level, duration, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Introduction au développement web', 'Apprenez les bases du développement web avec HTML, CSS et JavaScript.', 49.99, 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613', 'débutant', 1200, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'React pour les débutants', 'Maîtrisez React.js et créez des applications web modernes.', 79.99, 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2', 'intermédiaire', 1800, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Développement backend avec Node.js', 'Créez des API RESTful et des applications serveur avec Node.js et Express.', 99.99, 'https://images.unsplash.com/photo-1627398242454-45a1465c2479', 'avancé', 2400, now(), now());

-- Insert sample chapters for the first formation
INSERT INTO public.chapters (id, formation_id, title, description, position, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Introduction à HTML', 'Découvrez les bases du langage HTML.', 1, now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Styles avec CSS', 'Apprenez à styliser vos pages web avec CSS.', 2, now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'JavaScript fondamentaux', 'Les bases de la programmation avec JavaScript.', 3, now(), now());

-- Insert sample lessons for the first chapter
INSERT INTO public.lessons (id, chapter_id, title, description, content, video_url, position, duration, created_at, updated_at)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Structure de base HTML', 'Comprendre la structure de base d''un document HTML.', '# Structure de base HTML\n\nUn document HTML est composé de plusieurs éléments qui forment ensemble la structure de base d''une page web.\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Titre de la page</title>\n</head>\n<body>\n  <h1>Mon premier titre</h1>\n  <p>Mon premier paragraphe.</p>\n</body>\n</html>\n```\n\nExpliquons chaque partie :\n\n- `<!DOCTYPE html>` : Déclaration du type de document\n- `<html>` : L''élément racine\n- `<head>` : Contient les métadonnées\n- `<body>` : Contient le contenu visible', 'https://www.youtube.com/watch?v=sample1', 1, 15, now(), now()),
  
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Balises HTML essentielles', 'Découvrez les balises HTML les plus couramment utilisées.', '# Balises HTML essentielles\n\nVoici les balises HTML les plus couramment utilisées :\n\n## Titres\n```html\n<h1>Titre principal</h1>\n<h2>Sous-titre</h2>\n<h3>Sous-sous-titre</h3>\n```\n\n## Paragraphes et formatage\n```html\n<p>Ceci est un paragraphe.</p>\n<strong>Texte en gras</strong>\n<em>Texte en italique</em>\n```\n\n## Listes\n```html\n<ul>\n  <li>Élément de liste non ordonnée</li>\n</ul>\n\n<ol>\n  <li>Premier élément de liste ordonnée</li>\n  <li>Deuxième élément</li>\n</ol>\n```\n\n## Liens et images\n```html\n<a href="https://example.com">Cliquez ici</a>\n<img src="image.jpg" alt="Description de l''image">\n```', 'https://www.youtube.com/watch?v=sample2', 2, 20, now(), now()),
  
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Formulaires HTML', 'Apprenez à créer des formulaires interactifs.', '# Formulaires HTML\n\nLes formulaires HTML permettent de collecter des données utilisateur.\n\n```html\n<form action="/submit-form" method="post">\n  <label for="name">Nom :</label>\n  <input type="text" id="name" name="name" required>\n  \n  <label for="email">Email :</label>\n  <input type="email" id="email" name="email" required>\n  \n  <label for="message">Message :</label>\n  <textarea id="message" name="message" rows="4" required></textarea>\n  \n  <button type="submit">Envoyer</button>\n</form>\n```\n\n## Types d''input courants\n\n- text : texte simple\n- email : adresse email\n- password : mot de passe\n- number : valeur numérique\n- checkbox : case à cocher\n- radio : bouton radio\n- file : téléchargement de fichier\n- submit : bouton d''envoi', 'https://www.youtube.com/watch?v=sample3', 3, 25, now(), now()); 