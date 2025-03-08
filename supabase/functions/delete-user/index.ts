// @ts-nocheck
// Fonction Edge Supabase pour la suppression de compte utilisateur
// Cette fonction utilise la clé de service pour supprimer un utilisateur
// Elle doit être déployée sur Supabase avec la commande:
// supabase functions deploy delete-user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Définition de l'interface pour la requête
interface DeleteUserRequest {
  user_id: string;
  auth_token?: string;
}

// Fonction principale qui traite la requête
Deno.serve(async (req) => {
  // Vérifier que la méthode est POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Récupérer les données de la requête
    const { user_id, auth_token } = await req.json() as DeleteUserRequest;
    
    // Vérifier que l'ID utilisateur est fourni
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'ID utilisateur requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables d\'environnement manquantes');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur incorrecte' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Vérifier l'authentification si un token est fourni
    if (auth_token) {
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(auth_token);
      
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'Authentification invalide' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Vérifier que l'utilisateur authentifié est celui qu'on veut supprimer
      // ou qu'il a un rôle d'administrateur
      if (authUser.id !== user_id && !authUser.app_metadata?.admin) {
        return new Response(
          JSON.stringify({ error: 'Non autorisé à supprimer cet utilisateur' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log(`Début de la suppression de l'utilisateur: ${user_id}`);
    
    // Supprimer les données associées à l'utilisateur
    try {
      // 1. Appeler la fonction RPC pour supprimer les données
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('delete_user', { user_id });
      
      if (rpcError) {
        console.error('Erreur lors de l\'appel RPC:', rpcError);
        // Continuer avec la méthode directe même si RPC échoue
      } else if (rpcData === true) {
        console.log('Utilisateur supprimé avec succès via RPC');
        return new Response(
          JSON.stringify({ success: true, message: 'Utilisateur supprimé avec succès' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // 2. Méthode directe si RPC échoue
      // Supprimer les certificats
      await supabaseAdmin.from('certificates').delete().eq('user_id', user_id);
      
      // Supprimer les progrès utilisateur
      await supabaseAdmin.from('user_progress').delete().eq('user_id', user_id);
      
      // Supprimer les formations utilisateur
      await supabaseAdmin.from('user_formations').delete().eq('user_id', user_id);
      
      // Supprimer le profil utilisateur
      await supabaseAdmin.from('profiles').delete().eq('id', user_id);
      
      // Supprimer l'utilisateur
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      console.log(`Utilisateur ${user_id} supprimé avec succès`);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Utilisateur supprimé avec succès' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la suppression de l\'utilisateur',
          details: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Erreur lors du traitement de la requête:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erreur lors du traitement de la requête' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 