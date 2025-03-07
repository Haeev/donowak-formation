import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware principal de l'application
 * Intercepte toutes les requêtes pour gérer l'authentification via Supabase
 * @param request - La requête entrante
 * @returns La réponse modifiée avec les cookies de session mis à jour
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Configuration du middleware
 * Définit les routes sur lesquelles le middleware doit s'exécuter
 * Exclut les routes API, les fichiers statiques, les images et favicon
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 