import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware principal de l'application
 * Intercepte toutes les requêtes pour gérer l'authentification via Supabase
 * @param request - La requête entrante
 * @returns La réponse modifiée avec les cookies de session mis à jour
 */
export async function middleware(request: NextRequest) {
  // Obtenir l'URL actuelle
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Exclure explicitement les routes d'API NextAuth pour éviter les conflits
  if (path.startsWith('/api/auth')) {
    console.log(`Middleware - Route d'API NextAuth ignorée: ${path}`);
    return NextResponse.next();
  }
  
  return updateSession(request);
}

/**
 * Configuration du middleware
 * Définit les routes sur lesquelles le middleware doit s'exécuter
 * Exclut les routes API NextAuth, les fichiers statiques, les images et favicon
 */
export const config = {
  matcher: [
    // Inclure toutes les routes sauf celles spécifiées
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Exclure explicitement les routes d'API NextAuth
    '/((?!api/auth).*)',
  ],
}; 