import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Crée et configure un client Supabase avec la clé de service
 * Ce client a des privilèges élevés et ne doit être utilisé que côté serveur
 * pour des opérations administratives comme la suppression de compte
 * 
 * ATTENTION: Ce client dispose de privilèges d'administrateur et ne doit jamais
 * être utilisé côté client ou exposé au navigateur.
 * 
 * @returns Instance du client Supabase avec privilèges admin typée avec le schéma de la base de données
 */
export function createAdminClient() {
  // Vérifier que les variables d'environnement sont définies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement Supabase manquantes:', { 
      url: supabaseUrl ? 'définie' : 'manquante', 
      key: supabaseServiceKey ? 'définie' : 'manquante' 
    });
    throw new Error('Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies');
  }
  
  // S'assurer que la clé de service ne commence pas par 'v'
  // Une clé commençant par 'v' pourrait indiquer une valeur corrompue
  if (supabaseServiceKey.startsWith('v')) {
    console.warn('La clé de service Supabase semble invalide (commence par "v")');
  }
  
  // Créer le client avec la clé de service
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
} 