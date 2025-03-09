/**
 * Script pour vérifier et corriger le statut administrateur de l'utilisateur loic.nowakowski@gmail.com
 * 
 * Ce script effectue les opérations suivantes :
 * 1. Vérifie si l'utilisateur loic.nowakowski@gmail.com existe
 * 2. Vérifie s'il a un profil
 * 3. Vérifie s'il a le rôle administrateur
 * 4. Corrige le rôle si nécessaire
 * 
 * Utilisation :
 * $ node src/scripts/check_and_fix_admin.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const ADMIN_EMAIL = 'loic.nowakowski@gmail.com';
const ADMIN_ROLE = 'admin';

// Créer le client Supabase avec la clé de service
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.error('Vérifiez que les variables suivantes sont définies dans .env.local:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Vérification du statut administrateur pour', ADMIN_EMAIL);
    const supabaseAdmin = createAdminClient();
    
    // 1. Vérifier si l'utilisateur existe
    console.log('\n1. Vérification de l\'existence de l\'utilisateur...');
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
    }
    
    const user = users.find(u => u.email === ADMIN_EMAIL);
    
    if (!user) {
      console.error(`❌ Utilisateur avec email ${ADMIN_EMAIL} non trouvé dans la base de données`);
      console.error('Créez d\'abord un compte avec cet email avant d\'exécuter ce script');
      process.exit(1);
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);
    
    // 2. Vérifier la structure de la table profiles
    console.log('\n2. Vérification de la structure de la table profiles...');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position" 
      });
      
    if (columnsError) {
      throw new Error(`Erreur lors de la vérification des colonnes: ${columnsError.message}`);
    }
    
    console.log('Colonnes disponibles dans la table profiles:');
    const columnNames = columns.map(col => col.column_name);
    console.log(columnNames);
    
    // 3. Vérifier si l'utilisateur a un profil
    console.log('\n3. Vérification du profil utilisateur...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = profil non trouvé, qu'on gère séparément
      throw new Error(`Erreur lors de la récupération du profil: ${profileError.message}`);
    }
    
    if (!profile) {
      console.log(`⚠️ Aucun profil trouvé pour ${ADMIN_EMAIL}, création en cours...`);
      
      // Préparer les données du profil en fonction des colonnes disponibles
      const profileData = {
        id: user.id,
        role: ADMIN_ROLE,
        email: user.email, // Inclure l'email qui semble être obligatoire
      };
      
      // Ajouter des valeurs par défaut pour les autres colonnes obligatoires
      if (columnNames.includes('username')) {
        profileData.username = user.email.split('@')[0]; // Utiliser la partie avant @ comme nom d'utilisateur
      }
      
      if (columnNames.includes('full_name')) {
        profileData.full_name = user.user_metadata?.full_name || user.email.split('@')[0];
      }
      
      if (columnNames.includes('created_at')) {
        profileData.created_at = new Date();
      }
      
      if (columnNames.includes('updated_at')) {
        profileData.updated_at = new Date();
      }
      
      console.log('Données du profil à créer:', profileData);
      
      // Créer un profil pour l'utilisateur
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert([profileData]);
        
      if (createProfileError) {
        throw new Error(`Erreur lors de la création du profil: ${createProfileError.message}`);
      }
      
      console.log(`✅ Profil créé avec succès pour ${ADMIN_EMAIL} avec rôle ${ADMIN_ROLE}`);
    } else {
      console.log(`✅ Profil trouvé pour ${ADMIN_EMAIL}`);
      
      // 4. Vérifier le rôle de l'utilisateur
      console.log('\n4. Vérification du rôle administrateur...');
      console.log(`Rôle actuel: ${profile.role || 'non défini'}`);
      
      if (profile.role !== ADMIN_ROLE) {
        console.log(`⚠️ L'utilisateur n'a pas le rôle ${ADMIN_ROLE}, mise à jour en cours...`);
        
        // Vérifier si la colonne role existe
        if (!columnNames.includes('role')) {
          console.log('⚠️ Colonne role manquante dans la table profiles, ajout en cours...');
          
          const { error: alterTableError } = await supabaseAdmin
            .rpc('exec_sql', { 
              sql_query: "ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user'" 
            });
            
          if (alterTableError) {
            throw new Error(`Erreur lors de l'ajout de la colonne role: ${alterTableError.message}`);
          }
          
          console.log('✅ Colonne role ajoutée avec succès à la table profiles');
        }
        
        // Mettre à jour le rôle de l'utilisateur
        const { error: updateRoleError } = await supabaseAdmin
          .from('profiles')
          .update({ role: ADMIN_ROLE })
          .eq('id', user.id);
          
        if (updateRoleError) {
          throw new Error(`Erreur lors de la mise à jour du rôle: ${updateRoleError.message}`);
        }
        
        console.log(`✅ Rôle mis à jour avec succès à ${ADMIN_ROLE} pour ${ADMIN_EMAIL}`);
      } else {
        console.log(`✅ L'utilisateur ${ADMIN_EMAIL} a déjà le rôle ${ADMIN_ROLE}`);
      }
    }
    
    // 5. Vérification finale
    console.log('\n5. Vérification finale du statut administrateur...');
    const { data: finalProfile, error: finalProfileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (finalProfileError) {
      throw new Error(`Erreur lors de la vérification finale: ${finalProfileError.message}`);
    }
    
    console.log(`Statut final: ${finalProfile.role === ADMIN_ROLE ? 'ADMINISTRATEUR' : 'NON ADMINISTRATEUR'}`);
    
    if (finalProfile.role === ADMIN_ROLE) {
      console.log('\n✅✅✅ L\'utilisateur est correctement configuré comme administrateur');
      console.log('\nVous devriez maintenant pouvoir accéder à /admin et être redirigé correctement');
      console.log('\n🔄 Essayez les actions suivantes :');
      console.log('1. Déconnectez-vous et reconnectez-vous à l\'application');
      console.log('2. Accédez directement à l\'URL "/admin"');
      console.log('3. Cliquez sur "Tableau de bord" dans le menu de navigation');
    } else {
      console.error('\n❌❌❌ Échec de la configuration de l\'utilisateur comme administrateur');
      console.error('Veuillez vérifier les logs pour identifier le problème');
    }
    
    // 6. Vérifier les variables d'environnement du middleware
    console.log('\n6. Vérification des variables d\'environnement du middleware...');
    console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Définie ✓' : 'NON DÉFINIE ⚠️'}`);
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Définie ✓' : 'NON DÉFINIE ⚠️'}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Définie ✓' : 'NON DÉFINIE ⚠️'}`);
    
  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main(); 