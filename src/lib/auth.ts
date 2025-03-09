import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database.types';
import { NextAuthOptions } from 'next-auth';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

/**
 * Crée un client Supabase pour les composants serveur
 * Utilise les cookies pour maintenir la session
 * 
 * @returns Client Supabase typé avec la structure de la base de données
 */
export const createClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Récupère un cookie par son nom
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Définit un cookie avec son nom, sa valeur et ses options
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Gère l'erreur ou l'ignore en développement
          }
        },
        // Supprime un cookie en définissant sa valeur à vide
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Gère l'erreur ou l'ignore en développement
          }
        },
      },
    }
  );
};

/**
 * Met à jour la session Supabase dans le middleware
 * Gère les cookies de session entre les requêtes
 * 
 * @param request - La requête entrante
 * @returns La réponse avec les cookies de session mis à jour
 */
export const updateSession = async (request: NextRequest) => {
  // Crée une réponse initiale
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Crée un client Supabase pour le middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Récupère un cookie par son nom depuis la requête
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        // Définit un cookie dans la réponse
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        // Supprime un cookie de la réponse
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Met à jour la session
  await supabase.auth.getUser();
  return response;
};

export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        // Récupérer le rôle de l'utilisateur depuis Supabase
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (data && !error) {
          session.user.role = data.role;
        } else {
          session.user.role = 'user';
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
}; 