-- Étape 7 : Ajout des triggers et fonctions pour mettre à jour les horodatages

-- Fonction pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vérifier et créer des triggers pour chaque table avec un champ updated_at
DO $$
DECLARE
  tables TEXT[] := ARRAY['profiles', 'formations', 'chapters', 'lessons', 'user_progress', 'quizzes'];
  tab TEXT;
BEGIN
  FOREACH tab IN ARRAY tables
  LOOP
    -- Vérifier si la table existe et a une colonne updated_at
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = tab 
      AND column_name = 'updated_at'
    ) THEN
      -- Vérifier si le trigger existe déjà
      IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'update_' || tab || '_updated_at'
      ) THEN
        -- Créer le trigger dynamiquement
        EXECUTE format('
          CREATE TRIGGER update_%I_updated_at
          BEFORE UPDATE ON public.%I
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at();
        ', tab, tab);
        
        RAISE NOTICE 'Trigger créé pour la table %', tab;
      ELSE
        RAISE NOTICE 'Le trigger pour la table % existe déjà', tab;
      END IF;
    ELSE
      RAISE NOTICE 'La table % n''existe pas ou n''a pas de colonne updated_at', tab;
    END IF;
  END LOOP;
END
$$; 