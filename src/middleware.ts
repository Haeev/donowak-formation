import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware principal de l'application
 * Gère les cookies de session et les redirections conditionnelles
 * 
 * @param request - La requête entrante
 * @returns La réponse modifiée avec les cookies de session mis à jour et les redirections appropriées
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
    // Récupérer la session utilisateur
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si l'utilisateur est connecté et que nous sommes sur des chemins spécifiques
    if (session) {
      // Vérifier les redirections conditionnelles pour les administrateurs
      const dashboardPaths = ['/dashboard', '/dashboard/'];
      const isOnDashboardPath = dashboardPaths.some(p => path === p) || path.startsWith('/dashboard/');
      
      // Uniquement pour les chemins du dashboard standard ou la racine (/)
      if (isOnDashboardPath || path === '/') {
        // Vérifier si l'utilisateur est administrateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        // Si l'utilisateur est administrateur, rediriger vers le dashboard admin
        if (profile && profile.role === 'admin') {
          // Ne rediriger que si l'utilisateur n'est pas déjà sur un chemin admin
          if (!path.startsWith('/admin')) {
            console.log(`[Middleware] Redirection admin: ${path} → /admin`);
            return NextResponse.redirect(new URL('/admin', request.url));
          }
        }
      }
      
      // Si l'utilisateur n'est pas administrateur mais tente d'accéder à /admin
      if (path.startsWith('/admin')) {
        // Vérifier si l'utilisateur est administrateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        // Si l'utilisateur n'est pas administrateur, rediriger vers le dashboard standard
        if (!profile || profile.role !== 'admin') {
          console.log(`[Middleware] Redirection utilisateur standard: ${path} → /dashboard`);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
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