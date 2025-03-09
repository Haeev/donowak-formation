import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Route API pour rétrograder un administrateur en utilisateur normal
 * Nécessite des droits d'administrateur pour être exécutée
 * 
 * @body { userId: string } - L'identifiant de l'utilisateur à rétrograder
 * @returns { success: boolean } - Indique si la rétrogradation a réussi
 */
export async function POST(request: Request) {
  try {
    // Vérifier si l'utilisateur actuel est un administrateur
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur est authentifié
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur actuel est un administrateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Droits d\'administrateur requis' },
        { status: 403 }
      );
    }
    
    // Récupérer les données de la requête
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Identifiant utilisateur manquant' },
        { status: 400 }
      );
    }
    
    // Un administrateur ne peut pas se rétrograder lui-même
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Impossible de vous rétrograder vous-même' },
        { status: 400 }
      );
    }
    
    // Utiliser le client admin pour rétrograder l'utilisateur
    const supabaseAdmin = createAdminClient();
    
    // Appeler la fonction RPC pour rétrograder l'utilisateur
    const { data, error } = await supabaseAdmin.rpc('demote_from_admin', {
      target_user_id: userId
    });
    
    if (error) {
      console.error('Erreur lors de la rétrogradation de l\'utilisateur:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la rétrogradation de l\'utilisateur' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé ou n\'est pas administrateur' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la rétrogradation de l\'utilisateur:', error);
    
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 