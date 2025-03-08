/**
 * Script pour supprimer et recréer un compte administrateur
 * 
 * Ce script effectue les opérations suivantes :
 * 1. Supprime le compte loic.nowakowski@gmail.com s'il existe
 * 2. Crée un nouveau compte avec le même email et le mot de passe admin123
 * 3. Configure le compte avec le rôle administrateur
 * 
 * Utilisation :
 * $ node src/scripts/create_admin_account.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const ADMIN_EMAIL = 'loic.nowakowski@gmail.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE = 'admin';

// Créer le client Supabase avec la clé de service
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement Supabase manquantes');
    process.exit(1);
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Démarrage du script de création de compte administrateur');
    const supabaseAdmin = createAdminClient();
    
    // 1. Vérifier si l'utilisateur existe
    console.log(`🔍 Recherche de l'utilisateur ${ADMIN_EMAIL}...`);
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(user => user.email === ADMIN_EMAIL);
    
    // 2. Supprimer l'utilisateur s'il existe
    if (existingUser) {
      console.log(`🗑️ Suppression de l'utilisateur existant (ID: ${existingUser.id})...`);
      
      // Supprimer les données associées
      console.log('🧹 Suppression des données associées...');
      
      // Supprimer le profil
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', existingUser.id);
      
      if (profileDeleteError) {
        console.warn(`⚠️ Erreur lors de la suppression du profil: ${profileDeleteError.message}`);
      } else {
        console.log('✅ Profil supprimé avec succès');
      }
      
      // Supprimer les autres données associées si nécessaire
      // ...
      
      // Supprimer le compte utilisateur
      const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      
      if (userDeleteError) {
        console.error(`❌ Erreur lors de la suppression de l'utilisateur: ${userDeleteError.message}`);
        process.exit(1);
      } else {
        console.log('✅ Utilisateur supprimé avec succès');
      }
    } else {
      console.log('ℹ️ Aucun utilisateur existant trouvé avec cet email');
    }
    
    // 3. Créer un nouveau compte
    console.log(`👤 Création d'un nouveau compte pour ${ADMIN_EMAIL}...`);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true // Confirmer l'email automatiquement
    });
    
    if (createError) {
      console.error(`❌ Erreur lors de la création de l'utilisateur: ${createError.message}`);
      process.exit(1);
    }
    
    console.log(`✅ Utilisateur créé avec succès (ID: ${newUser.user.id})`);
    
    // 4. Attribuer le rôle administrateur
    console.log('👑 Attribution du rôle administrateur...');
    
    // Vérifier si un profil existe déjà
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id);
    
    if (existingProfile && existingProfile.length > 0) {
      // Mettre à jour le profil existant
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: ADMIN_ROLE })
        .eq('id', newUser.user.id);
      
      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour du profil: ${updateError.message}`);
      } else {
        console.log('✅ Profil mis à jour avec le rôle administrateur');
      }
    } else {
      // Créer un nouveau profil
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert([{ 
          id: newUser.user.id,
          role: ADMIN_ROLE,
        }]);
      
      if (insertError) {
        console.error(`❌ Erreur lors de la création du profil: ${insertError.message}`);
      } else {
        console.log('✅ Profil créé avec le rôle administrateur');
      }
    }
    
    console.log('');
    console.log('🎉 Compte administrateur créé avec succès!');
    console.log('📧 Email: ' + ADMIN_EMAIL);
    console.log('🔑 Mot de passe: ' + ADMIN_PASSWORD);
    console.log('');
    console.log('Vous pouvez maintenant vous connecter à l\'application.');
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 