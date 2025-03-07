import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Met à jour la session Supabase sans gérer les redirections
 * Cette fonction est appelée par le middleware principal de l'application
 * et se contente de mettre à jour les cookies de session
 * 
 * @param request - La requête entrante
 * @returns La réponse modifiée avec les cookies de session mis à jour
 */
export async function updateSession(request: NextRequest) {
  // Obtenir l'URL actuelle
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Log minimal pour le débogage
  console.log(`Middleware - Mise à jour des cookies pour: ${path}`);
  
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
    // Mettre à jour la session sans effectuer de redirection
    await supabase.auth.getSession();
  } catch (error) {
    console.error('Middleware - Erreur:', error);
  }

  return response;
} 