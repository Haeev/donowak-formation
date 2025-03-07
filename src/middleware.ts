import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware principal de l'application
 * Gère l'authentification et les redirections basées sur l'état de la session
 * 
 * @param request - La requête entrante
 * @returns La réponse modifiée avec les cookies de session mis à jour et les redirections si nécessaire
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
    // Vérifier si l'utilisateur est authentifié
    const { data: { session } } = await supabase.auth.getSession();
    
    // Routes protégées qui nécessitent une authentification
    const protectedRoutes = ['/dashboard', '/admin'];
    
    // Routes d'authentification (login, register) qui ne devraient pas être accessibles si déjà connecté
    const authRoutes = ['/auth/login', '/auth/register'];
    
    // Vérifier si l'utilisateur tente d'accéder à une route protégée
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    
    // Vérifier si l'utilisateur tente d'accéder à une route d'authentification
    const isAuthRoute = authRoutes.some(route => path === route);

    // Rediriger les utilisateurs non authentifiés qui tentent d'accéder à une route protégée
    if (!session && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Rediriger les utilisateurs authentifiés qui tentent d'accéder aux pages d'authentification
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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