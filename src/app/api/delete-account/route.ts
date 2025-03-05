import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Créer un client admin avec la clé de service
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour supprimer votre compte' },
        { status: 401 }
      );
    }
    
    console.log('Tentative de suppression du compte utilisateur:', user.id);
    
    // 1. D'abord supprimer les données associées à l'utilisateur dans les tables
    try {
      // Supprimer les données de la table profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) {
        console.log('Erreur lors de la suppression du profil:', profileError);
      }
      
      // Supprimer les données des autres tables liées à l'utilisateur
      // Par exemple: user_formations, user_progress, certificates, etc.
      const { error: userFormationsError } = await supabaseAdmin
        .from('user_formations')
        .delete()
        .eq('user_id', user.id);
        
      if (userFormationsError) {
        console.log('Erreur lors de la suppression des formations utilisateur:', userFormationsError);
      }
      
      const { error: userProgressError } = await supabaseAdmin
        .from('user_progress')
        .delete()
        .eq('user_id', user.id);
        
      if (userProgressError) {
        console.log('Erreur lors de la suppression des progrès utilisateur:', userProgressError);
      }
      
      const { error: certificatesError } = await supabaseAdmin
        .from('certificates')
        .delete()
        .eq('user_id', user.id);
        
      if (certificatesError) {
        console.log('Erreur lors de la suppression des certificats:', certificatesError);
      }
    } catch (dataError) {
      console.error('Erreur lors de la suppression des données utilisateur:', dataError);
    }
    
    // 2. Ensuite supprimer l'utilisateur de la table auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (error) {
      console.error('Erreur lors de la suppression du compte avec la clé de service:', error);
      
      // Si la suppression échoue, on déconnecte quand même l'utilisateur
      await supabase.auth.signOut();
      
      return NextResponse.json(
        { 
          message: 'Nous n\'avons pas pu supprimer complètement votre compte, mais vous avez été déconnecté. Veuillez contacter l\'administrateur.',
          partial: true 
        },
        { status: 200 }
      );
    }
    
    console.log('Compte utilisateur supprimé avec succès:', user.id);
    
    // Déconnecter l'utilisateur après la suppression réussie
    await supabase.auth.signOut();
    
    // Définir des cookies d'expiration pour forcer la déconnexion côté client
    const headers = new Headers();
    headers.append('Set-Cookie', 'sb-access-token=; Max-Age=0; Path=/; HttpOnly');
    headers.append('Set-Cookie', 'sb-refresh-token=; Max-Age=0; Path=/; HttpOnly');
    
    return new NextResponse(
      JSON.stringify({ message: 'Votre compte a été supprimé avec succès' }),
      { 
        status: 200,
        headers
      }
    );
  } catch (error: any) {
    console.error('Erreur lors de la suppression du compte:', error);
    
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
} 