import { createBrowserClient } from '@supabase/ssr';

/**
 * Crée et configure un client Supabase pour le navigateur
 * Utilise les variables d'environnement pour l'URL et la clé anonyme
 * À utiliser dans les composants côté client uniquement
 * @returns Instance du client Supabase configurée pour le navigateur
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
} 