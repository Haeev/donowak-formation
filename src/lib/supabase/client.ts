import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

/**
 * Crée et configure un client Supabase pour le navigateur
 * Utilise les variables d'environnement pour l'URL et la clé anonyme
 * À utiliser dans les composants côté client uniquement
 * @returns Instance du client Supabase configurée pour le navigateur
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Variables d\'environnement Supabase manquantes:', { 
      url: supabaseUrl ? 'définie' : 'manquante', 
      key: supabaseAnonKey ? 'définie' : 'manquante' 
    });
  }
  
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
} 