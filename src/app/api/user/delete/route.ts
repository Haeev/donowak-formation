import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST() {
  console.log('API de suppression de compte appelée');
  
  try {
    // 1. Récupérer l'ID de l'utilisateur connecté
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('ID utilisateur à supprimer:', userId);
    
    // 2. Créer le client admin
    const supabaseAdmin = createAdminClient();
    
    // 3. Supprimer les données associées à l'utilisateur
    // Supprimer les formations de l'utilisateur
    await supabaseAdmin.from('user_formations').delete().eq('user_id', userId);
    
    // Supprimer les progressions de l'utilisateur
    await supabaseAdmin.from('user_progress').delete().eq('user_id', userId);
    
    // Supprimer les certificats de l'utilisateur
    await supabaseAdmin.from('certificates').delete().eq('user_id', userId);
    
    // 4. Anonymiser le profil utilisateur
    await supabaseAdmin.from('profiles').update({
      email: `deleted_${userId}@deleted.com`,
      full_name: 'Compte supprimé',
      avatar_url: null
    }).eq('id', userId);
    
    // 5. Déconnecter l'utilisateur
    await supabase.auth.signOut({ scope: 'global' });
    
    // 6. Créer une réponse avec suppression des cookies
    const response = NextResponse.json({ 
      success: true,
      message: 'Compte supprimé avec succès'
    });
    
    // Supprimer tous les cookies
    const cookieNames = [
      'sb-access-token', 
      'sb-refresh-token', 
      'supabase-auth-token',
      'sb:token',
      'sb-provider-token'
    ];
    
    for (const name of cookieNames) {
      response.cookies.delete(name);
    }
    
    return response;
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
} 