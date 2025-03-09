/**
 * Script pour diagnostiquer les problèmes potentiels de redirection dans le middleware
 * 
 * Ce script simule une requête comme le ferait le middleware pour vérifier si
 * l'utilisateur loic.nowakowski@gmail.com est correctement identifié comme administrateur
 * 
 * Utilisation:
 * node middleware_debug.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const ADMIN_EMAIL = 'loic.nowakowski@gmail.com';
const TEST_PATH = '/dashboard'; // Chemin à tester pour la redirection

// Fonction principale
async function main() {
  try {
    console.log('🔍 Diagnostic du problème de redirection middleware pour', ADMIN_EMAIL);
    
    // 1. Vérifier les variables d'environnement
    console.log('\n1. Vérification des variables d\'environnement:');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Variables d\'environnement Supabase manquantes!');
      console.error('Vérifiez que les variables suivantes sont définies dans .env.local:');
      if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseAnonKey) console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
      process.exit(1);
    }
    
    console.log('✅ Variables d\'environnement Supabase correctement définies');
    
    // 2. Créer un client Supabase
    console.log('\n2. Simulation du client Supabase du middleware:');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Client Supabase créé');
    
    // 3. Créer un client admin pour les opérations avancées
    let supabaseAdmin;
    if (supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      console.log('✅ Client Supabase admin créé');
    } else {
      console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY non définie, client admin non créé');
    }
    
    // 4. Obtenir l'utilisateur par email (avec le client admin)
    let userId;
    if (supabaseAdmin) {
      console.log('\n3. Recherche de l\'utilisateur par email:');
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
      }
      
      const user = users.find(u => u.email === ADMIN_EMAIL);
      
      if (!user) {
        console.error(`❌ Utilisateur avec email ${ADMIN_EMAIL} non trouvé!`);
        process.exit(1);
      }
      
      userId = user.id;
      console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${userId})`);
    } else {
      console.log('\n3. Client admin non disponible, impossible de rechercher par email');
    }
    
    // 5. Simuler l'opération du middleware
    console.log('\n4. Simulation de l\'opération du middleware pour le chemin:', TEST_PATH);
    
    console.log('4.1. Récupération de la session utilisateur:');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur lors de la récupération de la session:', sessionError.message);
      console.error('Le middleware ne pourra pas rediriger correctement.');
      process.exit(1);
    }
    
    if (!session) {
      console.log('⚠️ Aucune session active trouvée!');
      console.log('Si vous êtes connecté dans le navigateur, cela signifie que les cookies ne sont pas disponibles pour ce script.');
      console.log('Vous devriez tout de même vérifier si vous êtes bien connecté dans l\'application.');
      
      if (!userId) {
        console.error('❌ Impossible de continuer sans session ni ID utilisateur!');
        process.exit(1);
      }
      
      console.log('Utilisation de l\'ID utilisateur récupéré précédemment pour continuer les tests...');
    } else {
      userId = session.user.id;
      console.log(`✅ Session active trouvée pour: ${session.user.email}`);
    }
    
    console.log('\n4.2. Vérification du profil et du rôle utilisateur:');
    
    // Utiliser le client admin si pas de session
    const clientToUse = session ? supabase : supabaseAdmin;
    
    if (!clientToUse) {
      console.error('❌ Aucun client Supabase disponible pour vérifier le profil!');
      process.exit(1);
    }
    
    const { data: profile, error: profileError } = await clientToUse
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
      console.error('Le middleware ne pourra pas déterminer si l\'utilisateur est administrateur.');
      process.exit(1);
    }
    
    if (!profile) {
      console.error('❌ Aucun profil trouvé pour l\'utilisateur!');
      console.error('Le middleware ne pourra pas déterminer si l\'utilisateur est administrateur.');
      process.exit(1);
    }
    
    console.log(`✅ Profil trouvé avec rôle: ${profile.role || 'non défini'}`);
    
    const isAdmin = profile.role === 'admin';
    
    console.log('\n5. Décision de redirection:');
    if (isAdmin) {
      console.log(`✅ L'utilisateur est administrateur.`);
      
      if (TEST_PATH === '/' || TEST_PATH.startsWith('/dashboard')) {
        console.log(`✅ Pour le chemin ${TEST_PATH}, le middleware devrait rediriger vers /admin`);
      } else if (TEST_PATH.startsWith('/admin')) {
        console.log(`✅ Pour le chemin ${TEST_PATH}, le middleware ne devrait pas rediriger (déjà sur /admin)`);
      } else {
        console.log(`✅ Pour le chemin ${TEST_PATH}, le middleware ne devrait pas rediriger (chemin neutre)`);
      }
    } else {
      console.log(`❌ L'utilisateur n'est PAS administrateur (rôle: ${profile.role}).`);
      console.log('Le middleware ne redirigera pas vers /admin.');
      console.log('SOLUTION: Exécutez le script SQL super_simple_admin.sql pour corriger le rôle.');
    }
    
    console.log('\n6. Résumé et recommandations:');
    
    if (isAdmin) {
      console.log('✅ Le compte devrait être correctement configuré comme administrateur.');
      console.log('\nSi vous rencontrez encore des problèmes de redirection:');
      console.log('1. Vérifiez que le middleware est bien déployé (vercel deploy --prod)');
      console.log('2. Videz le cache de votre navigateur ou utilisez une fenêtre de navigation privée');
      console.log('3. Déconnectez-vous et reconnectez-vous à l\'application');
      console.log('4. Vérifiez les logs côté serveur dans le tableau de bord Vercel');
    } else {
      console.log('❌ Le compte n\'est PAS configuré comme administrateur.');
      console.log('\nActions recommandées:');
      console.log('1. Exécutez le script SQL super_simple_admin.sql dans la console SQL de Supabase');
      console.log('2. Déconnectez-vous et reconnectez-vous à l\'application');
      console.log('3. Essayez à nouveau d\'accéder à /admin');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors du diagnostic:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
main(); 