import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Route API pour la suppression de compte utilisateur
 * Cette route effectue la suppression des données utilisateur et du compte en 3 étapes:
 * 1. Vérification de l'authentification
 * 2. Suppression des données associées (profiles, formations, progress, certificates)
 * 3. Suppression du compte utilisateur dans auth.users
 * 
 * Requiert une session utilisateur active et valide.
 */
export async function POST(request: Request) {
  console.log('🔄 Début du processus de suppression de compte');
  
  try {
    // Créer le client Supabase standard avec la session utilisateur
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur est authentifié
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError) {
      console.error('❌ Erreur lors de la récupération de la session:', sessionError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification de votre identité' },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.log('❌ Aucun utilisateur connecté pour la suppression de compte');
      return NextResponse.json(
        { error: 'Vous devez être connecté pour supprimer votre compte' },
        { status: 401 }
      );
    }
    
    console.log(`✅ Utilisateur authentifié pour suppression: ${user.id}`);
    
    // Créer le client admin avec privilèges élevés
    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminClient();
      console.log('✅ Client admin Supabase créé avec succès');
    } catch (adminError) {
      console.error('❌ Erreur lors de la création du client admin:', adminError);
      return NextResponse.json(
        { error: 'Erreur serveur lors de la suppression du compte' },
        { status: 500 }
      );
    }
    
    // Vérifier les variables d'environnement pour le débogage
    console.log('🛠️ Vérification des variables d\'environnement Supabase:');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'définie' : 'manquante'}`);
    console.log(`Clé de service: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'définie' : 'manquante'}`);
    if (process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('v')) {
      console.warn('⚠️ La clé de service semble invalide (commence par "v")');
    }
    
    // Envelopper chaque étape dans un bloc try/catch pour éviter qu'une erreur n'interrompe les autres étapes
    
    // 1. Supprimer les données utilisateur dans les tables
    
    // 1.1 Supprimer les certificats
    try {
      console.log('🔄 Suppression des certificats...');
      const { error: certificatesError } = await supabaseAdmin
        .from('certificates')
        .delete()
        .eq('user_id', user.id);
        
      if (certificatesError) {
        console.error('⚠️ Erreur lors de la suppression des certificats:', certificatesError);
      } else {
        console.log('✅ Certificats supprimés avec succès');
      }
    } catch (error) {
      console.error('❌ Exception lors de la suppression des certificats:', error);
    }
    
    // 1.2 Supprimer les progrès utilisateur
    try {
      console.log('🔄 Suppression des progrès utilisateur...');
      const { error: userProgressError } = await supabaseAdmin
        .from('user_progress')
        .delete()
        .eq('user_id', user.id);
        
      if (userProgressError) {
        console.error('⚠️ Erreur lors de la suppression des progrès utilisateur:', userProgressError);
      } else {
        console.log('✅ Progrès utilisateur supprimés avec succès');
      }
    } catch (error) {
      console.error('❌ Exception lors de la suppression des progrès utilisateur:', error);
    }
    
    // 1.3 Supprimer les formations utilisateur
    try {
      console.log('🔄 Suppression des formations utilisateur...');
      const { error: userFormationsError } = await supabaseAdmin
        .from('user_formations')
        .delete()
        .eq('user_id', user.id);
        
      if (userFormationsError) {
        console.error('⚠️ Erreur lors de la suppression des formations utilisateur:', userFormationsError);
      } else {
        console.log('✅ Formations utilisateur supprimées avec succès');
      }
    } catch (error) {
      console.error('❌ Exception lors de la suppression des formations utilisateur:', error);
    }
    
    // 1.4 Supprimer le profil utilisateur
    try {
      console.log('🔄 Suppression du profil utilisateur...');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) {
        console.error('⚠️ Erreur lors de la suppression du profil:', profileError);
      } else {
        console.log('✅ Profil supprimé avec succès');
      }
    } catch (error) {
      console.error('❌ Exception lors de la suppression du profil:', error);
    }
    
    // 2. Supprimer l'utilisateur de la table auth.users
    console.log('🔄 Tentative de suppression du compte utilisateur dans auth.users...');
    let authDeletionSuccess = false;
    
    // Méthode 1: Utiliser admin.deleteUser
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error('⚠️ Erreur lors de la suppression du compte avec admin.deleteUser:', error);
      } else {
        authDeletionSuccess = true;
        console.log('✅ Compte supprimé avec succès via admin.deleteUser');
      }
    } catch (error) {
      console.error('❌ Exception lors de la suppression du compte avec admin.deleteUser:', error);
    }
    
    // Méthode 2: Essayer avec RPC si la méthode 1 a échoué
    if (!authDeletionSuccess) {
      try {
        console.log('🔄 Tentative alternative avec RPC pour supprimer le compte...');
        
        // Appeler une fonction RPC si elle existe dans votre base de données
        const { error } = await supabaseAdmin.rpc('delete_user', { user_id: user.id });
        
        if (error) {
          console.error('⚠️ Erreur lors de la suppression du compte avec RPC:', error);
        } else {
          authDeletionSuccess = true;
          console.log('✅ Compte supprimé avec succès via RPC');
        }
      } catch (error) {
        console.error('❌ Exception lors de la suppression du compte avec RPC:', error);
      }
    }
    
    // 3. Déconnecter l'utilisateur et nettoyer les cookies
    console.log('🔄 Déconnexion de l\'utilisateur...');
    try {
      await supabase.auth.signOut();
      console.log('✅ Déconnexion réussie');
    } catch (signOutError) {
      console.error('⚠️ Erreur lors de la déconnexion:', signOutError);
    }
    
    // Définir des cookies d'expiration pour forcer la déconnexion côté client
    const headers = new Headers();
    headers.append('Set-Cookie', 'sb-access-token=; Max-Age=0; Path=/; HttpOnly');
    headers.append('Set-Cookie', 'sb-refresh-token=; Max-Age=0; Path=/; HttpOnly');
    
    // Réponse selon que la suppression a réussi ou non
    if (authDeletionSuccess) {
      console.log('✅ Processus de suppression de compte terminé avec succès');
      return new NextResponse(
        JSON.stringify({ 
          message: 'Votre compte a été supprimé avec succès',
          success: true
        }),
        { 
          status: 200,
          headers
        }
      );
    } else {
      console.log('⚠️ Processus de suppression de compte terminé avec des erreurs');
      return new NextResponse(
        JSON.stringify({ 
          message: 'Nous n\'avons pas pu supprimer complètement votre compte, mais vous avez été déconnecté. Veuillez contacter l\'administrateur.',
          partial: true,
          success: false
        }),
        { 
          status: 200,
          headers
        }
      );
    }
  } catch (error: any) {
    console.error('❌ Erreur globale lors de la suppression du compte:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Une erreur est survenue lors de la suppression du compte',
        success: false
      },
      { status: 500 }
    );
  }
} 