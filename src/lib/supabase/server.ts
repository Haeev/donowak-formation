import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crée et configure un client Supabase pour le serveur
 * Utilise les cookies de la requête pour maintenir la session
 * À utiliser dans les composants serveur ou les routes API
 * @returns Instance du client Supabase configurée pour le serveur
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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