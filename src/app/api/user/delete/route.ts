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
    
    // Obtenir le token d'accès pour l'API Supabase
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const accessToken = currentSession?.access_token;
    
    // Appeler la fonction Edge pour supprimer l'utilisateur
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId,
          authToken: accessToken
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur lors de l\'appel à la fonction Edge:', errorData);
        // Continuer même si la fonction Edge échoue, car nous avons déjà supprimé les données de l'utilisateur
      }
    } catch (edgeError) {
      console.error('Erreur lors de l\'appel à la fonction Edge:', edgeError);
      // Continuer même si la fonction Edge échoue
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