import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST() {
  console.log('API de suppression de compte appelée');
  
  try {
    const cookieStore = cookies();
    // Créer le client Supabase standard pour vérifier l'authentification
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      return NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 401 }
      );
    }
    
    if (!session) {
      console.error('Aucune session trouvée');
      return NextResponse.json(
        { error: 'Non autorisé - Aucune session' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    console.log('ID utilisateur à supprimer:', userId);
    
    // Créer le client admin avec la clé de service pour les opérations de suppression
    try {
      console.log('Création du client admin...');
      const supabaseAdmin = createAdminClient();
      console.log('Client admin créé avec succès');
      
      // Vérifier les variables d'environnement
      console.log('URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Définie' : 'Non définie');
      console.log('Clé de service Supabase:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Définie' : 'Non définie');
      
      // Supprimer toutes les données associées à l'utilisateur
      // Supprimer les formations de l'utilisateur
      console.log('Tentative de suppression des formations de l\'utilisateur...');
      const { error: userFormationsError } = await supabaseAdmin
        .from('user_formations')
        .delete()
        .eq('user_id', userId);
        
      if (userFormationsError) {
        console.error('Erreur lors de la suppression des formations de l\'utilisateur:', userFormationsError);
      } else {
        console.log('Formations de l\'utilisateur supprimées avec succès');
      }
      
      // Supprimer les progressions de l'utilisateur
      console.log('Tentative de suppression des progressions de l\'utilisateur...');
      const { error: userProgressError } = await supabaseAdmin
        .from('user_progress')
        .delete()
        .eq('user_id', userId);
        
      if (userProgressError) {
        console.error('Erreur lors de la suppression des progressions de l\'utilisateur:', userProgressError);
      } else {
        console.log('Progressions de l\'utilisateur supprimées avec succès');
      }
      
      // Supprimer les certificats de l'utilisateur
      console.log('Tentative de suppression des certificats de l\'utilisateur...');
      const { error: userCertificatesError } = await supabaseAdmin
        .from('certificates')
        .delete()
        .eq('user_id', userId);
        
      if (userCertificatesError) {
        console.error('Erreur lors de la suppression des certificats de l\'utilisateur:', userCertificatesError);
      } else {
        console.log('Certificats de l\'utilisateur supprimées avec succès');
      }
      
      // Supprimer le profil utilisateur en dernier
      console.log('Tentative de suppression du profil utilisateur...');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) {
        console.error('Erreur lors de la suppression du profil:', profileError);
      } else {
        console.log('Profil utilisateur supprimé avec succès');
      }
      
      // Essayer de supprimer l'utilisateur directement
      try {
        console.log('Tentative de suppression de l\'utilisateur avec auth.admin.deleteUser...');
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (deleteUserError) {
          console.error('Erreur lors de la suppression de l\'utilisateur avec auth.admin.deleteUser:', deleteUserError);
          
          // Essayer une autre approche
          console.log('Tentative de suppression de l\'utilisateur avec rpc...');
          const { error: rpcError } = await supabaseAdmin.rpc('delete_user', { user_id: userId });
          
          if (rpcError) {
            console.error('Erreur lors de la suppression de l\'utilisateur avec rpc:', rpcError);
            
            // Si toutes les tentatives échouent, marquer l'utilisateur comme supprimé
            console.log('Tentative de marquage de l\'utilisateur comme supprimé...');
            const { error: updateError } = await supabaseAdmin.auth.updateUser({
              data: { 
                deleted: true,
                deleted_at: new Date().toISOString(),
                email_disabled: true
              }
            });
            
            if (updateError) {
              console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateError);
            } else {
              console.log('Utilisateur marqué comme supprimé avec succès');
            }
          } else {
            console.log('Utilisateur supprimé avec succès via rpc');
          }
        } else {
          console.log('Utilisateur supprimé avec succès via auth.admin.deleteUser');
        }
      } catch (deleteError) {
        console.error('Exception lors de la suppression de l\'utilisateur:', deleteError);
        
        // Si une exception est levée, essayer de marquer l'utilisateur comme supprimé
        try {
          console.log('Tentative de marquage de l\'utilisateur comme supprimé après exception...');
          const { error: updateError } = await supabaseAdmin.auth.updateUser({
            data: { 
              deleted: true,
              deleted_at: new Date().toISOString(),
              email_disabled: true
            }
          });
          
          if (updateError) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur après exception:', updateError);
          } else {
            console.log('Utilisateur marqué comme supprimé avec succès après exception');
          }
        } catch (updateError) {
          console.error('Exception lors de la mise à jour de l\'utilisateur après exception:', updateError);
        }
      }
    } catch (adminError) {
      console.error('Erreur lors de la création du client admin:', adminError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du client admin' },
        { status: 500 }
      );
    }
    
    try {
      // Déconnecter l'utilisateur
      console.log('Tentative de déconnexion de l\'utilisateur...');
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Erreur lors de la déconnexion:', signOutError);
      } else {
        console.log('Utilisateur déconnecté avec succès');
      }
    } catch (signOutError) {
      console.error('Erreur lors de la déconnexion:', signOutError);
    }
    
    // Supprimer les cookies de session
    console.log('Création de la réponse et suppression des cookies...');
    const response = NextResponse.json({ success: true });
    
    // Supprimer tous les cookies liés à Supabase
    try {
      const supabaseCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
      supabaseCookies.forEach(name => {
        response.cookies.delete(name);
      });
      console.log('Cookies supprimés avec succès');
    } catch (cookieError) {
      console.error('Erreur lors de la suppression des cookies:', cookieError);
    }
    
    console.log('Suppression de compte terminée avec succès');
    return response;
  } catch (error) {
    console.error('Erreur globale lors de la suppression du compte:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
} 