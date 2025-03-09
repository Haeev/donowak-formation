-- Script pour ajouter le champ audio_url à la table lessons et corriger le trigger

-- 1. Ajouter le champ audio_url à la table lessons s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE public.lessons ADD COLUMN audio_url TEXT;
    END IF;
END $$;

-- 2. Mettre à jour le trigger pour gérer correctement le cas où audio_url est NULL
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
    COALESCE(NEW.content, ''),
    NEW.title,
    NEW.description,
    NEW.video_url,
    NEW.audio_url,
    COALESCE(NEW.duration, 0),
    auth.uid(),
    'Mise à jour automatique'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Mettre à jour le code de création de leçon pour inclure audio_url
-- Note: Cette partie est informative, car la modification doit être faite dans le code TypeScript
/*
const { data, error } = await supabase
  .from('lessons')
  .insert({
    chapter_id: chapterId,
    title: 'Nouvelle leçon',
    description: 'Description de la leçon',
    content: '# Nouvelle leçon\n\nContenu de la leçon',
    position: nextPosition,
    duration: 0,
    audio_url: null, // Ajouter cette ligne
  })
*/ 