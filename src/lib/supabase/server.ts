import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

/**
 * Crée et configure un client Supabase pour le serveur
 * Utilise les cookies de la requête pour maintenir la session
 * À utiliser dans les composants serveur ou les routes API
 * 
 * Cette fonction doit être utilisée uniquement côté serveur (Server Components, API Routes).
 * Pour les composants clients, utilisez createClient() depuis @/lib/supabase/client.ts
 * 
 * @returns Instance du client Supabase configurée pour le serveur avec le typage de la base de données
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  // Vérifier que les variables d'environnement sont définies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Variables d\'environnement Supabase manquantes:', { 
      url: supabaseUrl ? 'définie' : 'manquante', 
      key: supabaseAnonKey ? 'définie' : 'manquante' 
    });
  }
  
  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        // Récupère un cookie par son nom
        get(name) {
          return cookieStore.get(name)?.value;
        },
        // Définit un cookie avec son nom, sa valeur et ses options
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        // Supprime un cookie en définissant sa durée de vie à 0
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
} 