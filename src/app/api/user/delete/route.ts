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
    console.log('ID utilisateur à marquer comme supprimé:', userId);
    
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
      
      // Mettre à jour le profil utilisateur pour le marquer comme supprimé
      console.log('Tentative de mise à jour du profil utilisateur...');
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          email: `deleted_${userId}@deleted.com`, // Anonymiser l'email
          full_name: 'Compte supprimé',
          avatar_url: null,
          phone: null,
          bio: null
        })
        .eq('id', userId);
        
      if (profileUpdateError) {
        console.error('Erreur lors de la mise à jour du profil:', profileUpdateError);
      } else {
        console.log('Profil utilisateur marqué comme supprimé avec succès');
      }
      
      // Marquer l'utilisateur comme supprimé dans les métadonnées
      console.log('Tentative de marquage de l\'utilisateur comme supprimé...');
      const { error: userUpdateError } = await supabaseAdmin.auth.updateUser({
        email: `deleted_${userId}@deleted.com`, // Anonymiser l'email
        data: { 
          deleted: true,
          deleted_at: new Date().toISOString(),
          email_disabled: true
        }
      });
      
      if (userUpdateError) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', userUpdateError);
      } else {
        console.log('Utilisateur marqué comme supprimé avec succès');
      }
      
      // Désactiver l'utilisateur
      console.log('Tentative de désactivation de l\'utilisateur...');
      try {
        const { error: disableError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { 
            user_metadata: { 
              deleted: true,
              deleted_at: new Date().toISOString(),
              disabled: true
            },
            app_metadata: {
              disabled: true
            }
          }
        );
        
        if (disableError) {
          console.error('Erreur lors de la désactivation de l\'utilisateur:', disableError);
        } else {
          console.log('Utilisateur désactivé avec succès');
        }
      } catch (disableError) {
        console.error('Exception lors de la désactivation de l\'utilisateur:', disableError);
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
    
    console.log('Compte marqué comme supprimé avec succès');
    return response;
  } catch (error) {
    console.error('Erreur globale lors de la suppression du compte:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
} 