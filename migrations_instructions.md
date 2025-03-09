# Instructions pour l'exécution des migrations

## Prérequis

1. Accédez à l'interface SQL de Supabase à l'adresse: https://votre-projet.supabase.co
2. Connectez-vous avec vos identifiants
3. Accédez à la section "SQL Editor"

## Migrations à exécuter

Exécutez les migrations suivantes dans l'ordre indiqué:

### 1. create_lesson_versions_table.sql

```sql
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
```

### 2. create_lesson_comments_table.sql

```sql
-- Création de la table de commentaires pour les leçons
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  is_flagged BOOLEAN DEFAULT false NOT NULL,
  flag_reason TEXT
);

-- Ajout d'un index pour accélérer les recherches par lesson_id
CREATE INDEX idx_lesson_comments_lesson_id ON public.lesson_comments(lesson_id);

-- Ajout d'un index pour accélérer les recherches par user_id
CREATE INDEX idx_lesson_comments_user_id ON public.lesson_comments(user_id);

-- Ajout d'un index pour les commentaires parents/enfants
CREATE INDEX idx_lesson_comments_parent_id ON public.lesson_comments(parent_id) WHERE parent_id IS NOT NULL;

-- Politiques RLS pour la table des commentaires
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les commentaires (tout le monde peut voir les commentaires approuvés)
CREATE POLICY "Les commentaires approuvés sont visibles par tous"
  ON public.lesson_comments
  FOR SELECT
  USING (is_approved = true AND is_deleted = false);

-- Politique de lecture pour les administrateurs (peuvent voir tous les commentaires)
CREATE POLICY "Les administrateurs peuvent voir tous les commentaires"
  ON public.lesson_comments
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de lecture pour les utilisateurs (peuvent voir leurs propres commentaires même non-approuvés)
CREATE POLICY "Les utilisateurs peuvent voir leurs propres commentaires"
  ON public.lesson_comments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique d'insertion pour les commentaires (les utilisateurs peuvent ajouter des commentaires)
CREATE POLICY "Les utilisateurs peuvent ajouter des commentaires"
  ON public.lesson_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour pour les administrateurs (peuvent mettre à jour tous les commentaires)
CREATE POLICY "Les administrateurs peuvent mettre à jour tous les commentaires"
  ON public.lesson_comments
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de mise à jour pour les utilisateurs (peuvent mettre à jour leurs propres commentaires non-approuvés)
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres commentaires non-approuvés"
  ON public.lesson_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND is_approved = false);

-- Politique de suppression pour les administrateurs (peuvent supprimer tous les commentaires)
CREATE POLICY "Les administrateurs peuvent supprimer tous les commentaires"
  ON public.lesson_comments
  FOR DELETE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de suppression pour les utilisateurs (suppression logique de leurs propres commentaires)
CREATE POLICY "Les utilisateurs peuvent supprimer logiquement leurs propres commentaires"
  ON public.lesson_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND is_deleted = false);

-- Ajout d'un trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION public.update_lesson_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_lesson_comments_updated_at(); 
```

### 3. create_lesson_statistics_table.sql

```sql
-- Création de la table de statistiques pour les leçons
CREATE TABLE IF NOT EXISTS public.lesson_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  total_views INTEGER DEFAULT 0 NOT NULL,
  unique_users INTEGER DEFAULT 0 NOT NULL,
  completion_count INTEGER DEFAULT 0 NOT NULL,
  avg_time_seconds INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Champs pour le suivi des évolutions dans le temps
  views_last_7_days INTEGER DEFAULT 0 NOT NULL,
  views_last_30_days INTEGER DEFAULT 0 NOT NULL,
  completions_last_7_days INTEGER DEFAULT 0 NOT NULL,
  completions_last_30_days INTEGER DEFAULT 0 NOT NULL,
  
  -- Champs pour le suivi des engagements
  comment_count INTEGER DEFAULT 0 NOT NULL,
  quiz_attempt_count INTEGER DEFAULT 0 NOT NULL,
  quiz_success_rate DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  
  -- Contrainte d'unicité pour une seule entrée par leçon
  UNIQUE(lesson_id)
);

-- Index pour accélérer les recherches
CREATE INDEX idx_lesson_statistics_lesson_id ON public.lesson_statistics(lesson_id);

-- RLS pour la table des statistiques
ALTER TABLE public.lesson_statistics ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les administrateurs
CREATE POLICY "Les administrateurs peuvent voir toutes les statistiques"
  ON public.lesson_statistics
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de mise à jour pour les administrateurs
CREATE POLICY "Les administrateurs peuvent mettre à jour les statistiques"
  ON public.lesson_statistics
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Création de la table de tracking détaillé des utilisateurs pour les leçons
CREATE TABLE IF NOT EXISTS public.user_lesson_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_time_seconds INTEGER, 
  completed BOOLEAN DEFAULT false NOT NULL,
  progress_percentage INTEGER DEFAULT 0 NOT NULL,
  last_position TEXT, -- Position dans la leçon si applicable (timestamp vidéo, section, etc.)
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE(user_id, lesson_id, start_time)
);

-- Index pour accélérer les recherches
CREATE INDEX idx_user_lesson_tracking_user ON public.user_lesson_tracking(user_id);
CREATE INDEX idx_user_lesson_tracking_lesson ON public.user_lesson_tracking(lesson_id);
CREATE INDEX idx_user_lesson_tracking_completed ON public.user_lesson_tracking(lesson_id, completed);

-- RLS pour la table de tracking
ALTER TABLE public.user_lesson_tracking ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les administrateurs
CREATE POLICY "Les administrateurs peuvent voir tout le tracking"
  ON public.user_lesson_tracking
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique de lecture pour les utilisateurs (leurs propres données)
CREATE POLICY "Les utilisateurs peuvent voir leur propre tracking"
  ON public.user_lesson_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique d'insertion pour les utilisateurs
CREATE POLICY "Les utilisateurs peuvent ajouter leur propre tracking"
  ON public.user_lesson_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour pour les utilisateurs
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre tracking"
  ON public.user_lesson_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour les statistiques d'une leçon
CREATE OR REPLACE FUNCTION public.update_lesson_statistics()
RETURNS TRIGGER AS $$
DECLARE
  lesson_stats_record public.lesson_statistics%ROWTYPE;
  unique_users_count INTEGER;
  completion_count INTEGER;
  avg_time_seconds INTEGER;
  recent_7_days_views INTEGER;
  recent_30_days_views INTEGER;
  recent_7_days_completions INTEGER;
  recent_30_days_completions INTEGER;
BEGIN
  -- Récupérer ou créer l'enregistrement de statistiques pour cette leçon
  BEGIN
    SELECT * INTO STRICT lesson_stats_record FROM public.lesson_statistics WHERE lesson_id = NEW.lesson_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      INSERT INTO public.lesson_statistics (lesson_id)
      VALUES (NEW.lesson_id)
      RETURNING * INTO lesson_stats_record;
  END;
  
  -- Calculer le nombre d'utilisateurs uniques
  SELECT COUNT(DISTINCT user_id) INTO unique_users_count 
  FROM public.user_lesson_tracking 
  WHERE lesson_id = NEW.lesson_id;
  
  -- Calculer le nombre de complétions
  SELECT COUNT(DISTINCT user_id) INTO completion_count 
  FROM public.user_lesson_tracking 
  WHERE lesson_id = NEW.lesson_id AND completed = true;
  
  -- Calculer le temps moyen passé
  SELECT COALESCE(AVG(total_time_seconds), 0) INTO avg_time_seconds 
  FROM public.user_lesson_tracking 
  WHERE lesson_id = NEW.lesson_id AND total_time_seconds IS NOT NULL;
  
  -- Calculer les vues sur les 7 derniers jours
  SELECT COUNT(DISTINCT user_id) INTO recent_7_days_views 
  FROM public.user_lesson_tracking 
  WHERE lesson_id = NEW.lesson_id AND start_time >= (now() - INTERVAL '7 days');
  
  -- Calculer les vues sur les 30 derniers jours
  SELECT COUNT(DISTINCT user_id) INTO recent_30_days_views 
  FROM public.user_lesson_tracking 
  WHERE lesson_id = NEW.lesson_id AND start_time >= (now() - INTERVAL '30 days');
  
  -- Calculer les complétions sur les 7 derniers jours
  SELECT COUNT(DISTINCT user_id) INTO recent_7_days_completions 
  FROM public.user_lesson_tracking 
  WHERE lesson_id = NEW.lesson_id AND completed = true AND (end_time >= (now() - INTERVAL '7 days') OR (end_time IS NULL AND start_time >= (now() - INTERVAL '7 days')));
  
  -- Calculer les complétions sur les 30 derniers jours
  SELECT COUNT(DISTINCT user_id) INTO recent_30_days_completions 
  FROM public.user_lesson_tracking 
  WHERE lesson_id = NEW.lesson_id AND completed = true AND (end_time >= (now() - INTERVAL '30 days') OR (end_time IS NULL AND start_time >= (now() - INTERVAL '30 days')));
  
  -- Mettre à jour les statistiques
  UPDATE public.lesson_statistics
  SET 
    total_views = total_views + 1,
    unique_users = unique_users_count,
    completion_count = completion_count,
    avg_time_seconds = avg_time_seconds,
    views_last_7_days = recent_7_days_views,
    views_last_30_days = recent_30_days_views,
    completions_last_7_days = recent_7_days_completions,
    completions_last_30_days = recent_30_days_completions,
    last_updated = now()
  WHERE lesson_id = NEW.lesson_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour les statistiques de leçon à chaque nouvel enregistrement de tracking
CREATE TRIGGER on_user_lesson_tracking_insert
  AFTER INSERT ON public.user_lesson_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lesson_statistics();

-- Trigger pour mettre à jour les statistiques de leçon à chaque mise à jour de tracking
CREATE TRIGGER on_user_lesson_tracking_update
  AFTER UPDATE ON public.user_lesson_tracking
  FOR EACH ROW
  WHEN (OLD.completed IS DISTINCT FROM NEW.completed OR 
        OLD.total_time_seconds IS DISTINCT FROM NEW.total_time_seconds)
  EXECUTE FUNCTION public.update_lesson_statistics(); 
```

## Vérification

Après avoir exécuté toutes les migrations, vérifiez que les tables ont été créées avec succès en exécutant la requête suivante:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lesson_versions', 'lesson_comments', 'lesson_statistics', 'user_lesson_tracking');
```

