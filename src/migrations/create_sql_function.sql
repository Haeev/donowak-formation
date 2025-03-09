-- Créer une fonction pour exécuter des requêtes SQL dynamiques
-- Cette fonction sera utilisée par notre script de migration

CREATE OR REPLACE FUNCTION pgmigrations_sql(query text)
RETURNS SETOF RECORD
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

-- Fonction pour exécuter du SQL dynamique
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 