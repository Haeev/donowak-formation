import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware principal de l'application
 * Met à jour uniquement les cookies de session sans gérer les redirections
 * 
 * @param request - La requête entrante
 * @returns La réponse modifiée avec les cookies de session mis à jour
 */
export async function middleware(request: NextRequest) {
  // Obtenir l'URL actuelle
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Ignorer les fichiers statiques et les routes d'API
  if (
    path.includes('/_next') || 
    path.includes('/api/') ||
    path.includes('/static/') ||
    path.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Créer une réponse initiale
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Créer un client Supabase pour le middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  try {
    // Mettre à jour la session sans effectuer de redirection
    await supabase.auth.getSession();
  } catch (error) {
    console.error('Middleware - Erreur:', error);
  }

  return response;
}

/**
 * Configuration du middleware
 * Définit les routes sur lesquelles le middleware doit s'exécuter
 */
export const config = {
  matcher: [
    // Inclure toutes les routes
    '/(.*)',
  ],
}; 