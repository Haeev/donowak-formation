-- Création de la table de versions des leçons
CREATE TABLE IF NOT EXISTS public.lesson_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  audio_url TEXT,
  duration INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  change_summary TEXT,
  
  -- Contrainte d'unicité pour éviter les doublons de versions
  UNIQUE(lesson_id, version_number)
);

-- Politique RLS pour la table des versions
ALTER TABLE public.lesson_versions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les versions (admin et auteurs)
CREATE POLICY "Admins can read lesson versions" 
  ON public.lesson_versions 
  FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique d'insertion pour les versions (admin seulement)
CREATE POLICY "Admins can insert lesson versions" 
  ON public.lesson_versions 
  FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Index pour accélérer les recherches par lesson_id et version_number
CREATE INDEX idx_lesson_versions_lesson_id ON public.lesson_versions(lesson_id);
CREATE INDEX idx_lesson_versions_version ON public.lesson_versions(lesson_id, version_number);

-- Fonction pour créer une nouvelle version automatiquement
CREATE OR REPLACE FUNCTION public.create_lesson_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Déterminer le numéro de la prochaine version
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.lesson_versions
  WHERE lesson_id = NEW.id;
  
  -- Insérer la nouvelle version
  INSERT INTO public.lesson_versions (
    lesson_id,
    version_number,
    content,
    title,
    description,
    video_url,
    audio_url,
    duration,
    created_by,
    change_summary
  ) VALUES (
    NEW.id,
    next_version,
    NEW.content,
    NEW.title,
    NEW.description,
    NEW.video_url,
    NEW.audio_url,
    NEW.duration,
    auth.uid(),
    'Mise à jour automatique'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement une version lors de la mise à jour d'une leçon
CREATE TRIGGER on_lesson_update
  AFTER UPDATE ON public.lessons
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR 
        OLD.title IS DISTINCT FROM NEW.title OR 
        OLD.description IS DISTINCT FROM NEW.description OR
        OLD.video_url IS DISTINCT FROM NEW.video_url OR
        OLD.duration IS DISTINCT FROM NEW.duration)
  EXECUTE FUNCTION public.create_lesson_version();

-- Trigger pour créer automatiquement une version lors de la création d'une leçon
CREATE TRIGGER on_lesson_creation
  AFTER INSERT ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.create_lesson_version(); 