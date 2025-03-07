import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware principal de l'application
 * Intercepte les requêtes pour mettre à jour les cookies de session Supabase
 * Les redirections sont gérées par NextAuth et non par ce middleware
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
  
  // Mettre à jour les cookies de session pour les autres routes
  return updateSession(request);
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