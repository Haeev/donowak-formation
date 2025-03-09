-- Fonction pour exécuter du SQL dynamiquement
-- Cette fonction est utilisée par l'API de migrations pour exécuter les scripts SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 