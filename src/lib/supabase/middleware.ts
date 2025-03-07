import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Met à jour la session Supabase et gère les redirections basées sur l'authentification
 * Cette fonction est appelée par le middleware principal de l'application
 * 
 * @param request - La requête entrante
 * @returns La réponse modifiée avec les cookies de session mis à jour et les redirections si nécessaire
 */
export async function updateSession(request: NextRequest) {
  // Obtenir l'URL actuelle
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log(`Middleware - URL: ${path}`);
  
  // Vérifier si la requête provient déjà d'une redirection pour éviter les boucles
  const redirectCount = request.headers.get('x-redirect-count') || '0';
  const redirectCountNum = parseInt(redirectCount, 10);
  
  // Si nous avons déjà redirigé plusieurs fois, arrêter pour éviter une boucle
  if (redirectCountNum > 2) {
    console.log(`Middleware - Trop de redirections (${redirectCountNum}), arrêt pour éviter une boucle`);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
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
        // Récupérer un cookie par son nom depuis la requête
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        // Définir un cookie dans la requête et la réponse
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        // Supprimer un cookie de la requête et de la réponse
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
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
    console.log(`Middleware - Session: ${session ? 'Trouvée' : 'Non trouvée'}`);

    // Routes protégées qui nécessitent une authentification
    const protectedRoutes = ['/dashboard', '/admin'];
    
    // Routes d'authentification (login, register) qui ne devraient pas être accessibles si déjà connecté
    const authRoutes = ['/auth/login', '/auth/register'];
    
    // Routes à ignorer (gérées par NextAuth ou autres systèmes)
    const ignoredRoutes = ['/api/auth', '/auth/callback', '/auth/confirm', '/auth/email-confirmed'];
    
    // Vérifier si la route actuelle doit être ignorée
    const shouldIgnoreRoute = ignoredRoutes.some(route => path.startsWith(route));
    
    // Si la route doit être ignorée, ne pas appliquer de redirection
    if (shouldIgnoreRoute) {
      console.log(`Middleware - Route ignorée: ${path}`);
      return response;
    }
    
    // Vérifier si l'utilisateur tente d'accéder à une route protégée
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    
    // Vérifier si l'utilisateur tente d'accéder à une route d'authentification
    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    console.log(`Middleware - Route protégée: ${isProtectedRoute}, Route d'auth: ${isAuthRoute}`);

    // Rediriger les utilisateurs non authentifiés qui tentent d'accéder à une route protégée
    if (!session && isProtectedRoute) {
      console.log('Middleware - Redirection vers la page de connexion');
      const redirectUrl = new URL('/auth/login', request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      
      // Incrémenter le compteur de redirections
      redirectResponse.headers.set('x-redirect-count', (redirectCountNum + 1).toString());
      
      return redirectResponse;
    }

    // Rediriger les utilisateurs authentifiés qui tentent d'accéder aux pages d'authentification
    if (session && isAuthRoute) {
      console.log('Middleware - Redirection vers le tableau de bord');
      const redirectUrl = new URL('/dashboard', request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      
      // Incrémenter le compteur de redirections
      redirectResponse.headers.set('x-redirect-count', (redirectCountNum + 1).toString());
      
      return redirectResponse;
    }
  } catch (error) {
    console.error('Middleware - Erreur:', error);
  }

  return response;
} 