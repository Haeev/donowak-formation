import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    // Créer le client Supabase
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Supprimer le profil utilisateur
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error('Erreur lors de la suppression du profil:', profileError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du profil' },
        { status: 500 }
      );
    }
    
    // Supprimer toutes les données associées à l'utilisateur
    // Supprimer les formations de l'utilisateur
    const { error: userFormationsError } = await supabase
      .from('user_formations')
      .delete()
      .eq('user_id', userId);
      
    if (userFormationsError) {
      console.error('Erreur lors de la suppression des formations de l\'utilisateur:', userFormationsError);
    }
    
    // Supprimer les progressions de l'utilisateur
    const { error: userProgressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);
      
    if (userProgressError) {
      console.error('Erreur lors de la suppression des progressions de l\'utilisateur:', userProgressError);
    }
    
    // Supprimer les certificats de l'utilisateur
    const { error: userCertificatesError } = await supabase
      .from('certificates')
      .delete()
      .eq('user_id', userId);
      
    if (userCertificatesError) {
      console.error('Erreur lors de la suppression des certificats de l\'utilisateur:', userCertificatesError);
    }
    
    // Marquer l'utilisateur comme supprimé dans les métadonnées
    // Puisque nous ne pouvons pas supprimer complètement l'utilisateur sans fonction Edge
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: { 
        deleted: true,
        deleted_at: new Date().toISOString(),
        email_disabled: true
      }
    });
    
    if (userUpdateError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', userUpdateError);
      // Continuer même en cas d'erreur
    }
    
    // Déconnecter l'utilisateur
    await supabase.auth.signOut();
    
    // Supprimer les cookies de session
    const response = NextResponse.json({ success: true });
    
    // Supprimer tous les cookies liés à Supabase
    const supabaseCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
    supabaseCookies.forEach(name => {
      response.cookies.delete(name);
    });
    
    return response;
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
} 