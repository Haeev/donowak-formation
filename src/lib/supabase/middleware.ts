import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
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

  // Vérifier si l'utilisateur est authentifié
  const { data: { session } } = await supabase.auth.getSession();

  // Obtenir l'URL actuelle
  const url = new URL(request.url);
  const path = url.pathname;

  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = ['/dashboard', '/admin'];
  
  // Routes d'authentification (login, register) qui ne devraient pas être accessibles si déjà connecté
  const authRoutes = ['/auth/login', '/auth/register'];
  
  // Vérifier si l'utilisateur tente d'accéder à une route protégée
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  // Vérifier si l'utilisateur tente d'accéder à une route d'authentification
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));

  // Rediriger les utilisateurs non authentifiés qui tentent d'accéder à une route protégée
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Rediriger les utilisateurs authentifiés qui tentent d'accéder aux pages d'authentification
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
} 