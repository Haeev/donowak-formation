import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Route API pour vérifier si l'utilisateur actuel est un administrateur
 * 
 * @returns { isAdmin: boolean } - Indique si l'utilisateur est un administrateur
 */
export async function GET() {
  try {
    // Créer le client Supabase
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur est authentifié
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Erreur lors de la vérification de la session:', authError);
      return NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 401 }
      );
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }
    
    // Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 500 }
      );
    }
    
    const isAdmin = profile?.role === 'admin';
    
    return NextResponse.json({ isAdmin });
  } catch (error: any) {
    console.error('Erreur lors de la vérification du rôle admin:', error);
    
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 