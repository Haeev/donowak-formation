import { createClient } from '@supabase/supabase-js';

/**
 * Crée et configure un client Supabase avec la clé de service
 * Ce client a des privilèges élevés et ne doit être utilisé que côté serveur
 * pour des opérations administratives comme la suppression de compte
 * @returns Instance du client Supabase avec privilèges admin
 */
export function createAdminClient() {
  // Vérifier que les variables d'environnement sont définies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies');
  }
  
  // Créer le client avec la clé de service
  return createClient(supabaseUrl, supabaseServiceKey);
} 