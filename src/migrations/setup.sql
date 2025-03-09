-- Création des tables de base pour la plateforme de formation

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'instructor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des formations
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  price DECIMAL(10, 2) DEFAULT 0,
  duration INTEGER, -- durée en heures
  published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des chapitres de formation
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des leçons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  description TEXT,
  position INTEGER NOT NULL,
  duration INTEGER, -- durée en minutes
  video_url TEXT,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des inscriptions aux formations
CREATE TABLE IF NOT EXISTS public.user_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount_paid DECIMAL(10, 2),
  UNIQUE(user_id, formation_id)
);

-- Table du suivi de progression
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  last_position INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- temps passé en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Table des quiz
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tentatives de quiz
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_id)
);

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_chapters_formation_id ON public.chapters(formation_id);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON public.lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_formations_user_id ON public.user_formations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_formations_formation_id ON public.user_formations(formation_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_formation_id ON public.user_progress(formation_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);

-- Fonction pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour le champ updated_at automatiquement
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_formations_updated_at
BEFORE UPDATE ON public.formations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_chapters_updated_at
BEFORE UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Politiques de sécurité Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Politique pour les profils
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" 
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Politique pour les formations
CREATE POLICY "Tout le monde peut voir les formations publiées" 
ON public.formations FOR SELECT
USING (published = TRUE);

CREATE POLICY "Les administrateurs peuvent tout faire avec les formations" 
ON public.formations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour les chapitres et leçons
CREATE POLICY "Tout le monde peut voir les chapitres des formations publiées" 
ON public.chapters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.formations
    WHERE formations.id = chapters.formation_id
    AND formations.published = TRUE
  )
);

CREATE POLICY "Tout le monde peut voir les leçons des formations publiées" 
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chapters
    JOIN public.formations ON chapters.formation_id = formations.id
    WHERE chapters.id = lessons.chapter_id
    AND formations.published = TRUE
  )
);

-- Politique pour les inscriptions aux formations
CREATE POLICY "Les utilisateurs peuvent voir leurs propres inscriptions" 
ON public.user_formations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent voir toutes les inscriptions" 
ON public.user_formations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour le suivi de progression
CREATE POLICY "Les utilisateurs peuvent voir et modifier leur propre progression" 
ON public.user_progress FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent voir toutes les progressions" 
ON public.user_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour les quiz
CREATE POLICY "Tout le monde peut voir les quiz des formations publiées" 
ON public.quizzes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons
    JOIN public.chapters ON lessons.chapter_id = chapters.id
    JOIN public.formations ON chapters.formation_id = formations.id
    WHERE lessons.id = quizzes.lesson_id
    AND formations.published = TRUE
  )
);

-- Politique pour les tentatives de quiz
CREATE POLICY "Les utilisateurs peuvent voir et créer leurs propres tentatives" 
ON public.quiz_attempts FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent voir toutes les tentatives" 
ON public.quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

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