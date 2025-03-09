import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware pour vérifier si l'utilisateur est un administrateur
 * Ce middleware n'est utilisé que côté client dans les composants protégés
 * 
 * @returns Un booléen indiquant si l'utilisateur est un administrateur
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Vérifier si l'utilisateur est authentifié
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    // Récupérer le profil de l'utilisateur
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Erreur lors de la vérification des droits admin:', error);
    return false;
  }
}

/**
 * Hook personnalisé pour protéger les routes d'administration
 * À utiliser dans les composants qui doivent être accessibles uniquement aux administrateurs
 * 
 * @param redirectUrl - URL de redirection si l'utilisateur n'est pas administrateur
 * @returns Une fonction qui redirige l'utilisateur si nécessaire
 */
export async function requireAdmin(redirectUrl: string = '/dashboard'): Promise<NextResponse | null> {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return NextResponse.redirect(new URL(redirectUrl, window.location.origin));
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la vérification des droits admin:', error);
    return NextResponse.redirect(new URL(redirectUrl, window.location.origin));
  }
} 