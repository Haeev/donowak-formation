#!/usr/bin/env node

const fetch = require('node-fetch');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour demander le serveur de déploiement
function askDeploymentUrl() {
  return new Promise((resolve) => {
    rl.question('URL du déploiement (par exemple https://donowak-formation.vercel.app) : ', (answer) => {
      resolve(answer.trim());
    });
  });
}

// Fonction pour demander le token d'authentification
function askAuthToken() {
  return new Promise((resolve) => {
    rl.question('Token d\'authentification (JWT du cookie supabase-auth-token) : ', (answer) => {
      resolve(answer.trim());
    });
  });
}

// Fonction pour demander si l'utilisateur veut exécuter la migration via l'API ou utiliser un script SQL direct
function askMigrationMethod() {
  return new Promise((resolve) => {
    rl.question('Méthode de migration (1: API, 2: Script SQL direct) [1]: ', (answer) => {
      if (answer.trim() === '' || answer.trim() === '1') {
        resolve('api');
      } else if (answer.trim() === '2') {
        resolve('sql');
      } else {
        console.log('Choix invalide, utilisation de la méthode API par défaut.');
        resolve('api');
      }
    });
  });
}

// Fonction pour afficher le contenu du script SQL si la méthode SQL est choisie
function showSqlScript() {
  try {
    const sqlPath = path.join(__dirname, 'create_quiz_attempts_table.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      console.log('\n=== Script SQL à exécuter dans l\'interface Supabase ===\n');
      console.log(sqlContent);
      console.log('\n=== Fin du script SQL ===\n');
      console.log('Copiez ce script et exécutez-le dans l\'interface SQL de Supabase (https://supabase.com/dashboard).');
    } else {
      console.log('\nScript SQL non trouvé. Veuillez créer manuellement la table en suivant la documentation.');
    }
  } catch (error) {
    console.error('\nErreur lors de la lecture du script SQL:', error);
  }
}

// Fonction principale
async function main() {
  try {
    console.log('=== Migration pour ajouter la table quiz_attempts et les vues/fonctions associées ===');
    
    const migrationMethod = await askMigrationMethod();
    
    if (migrationMethod === 'sql') {
      showSqlScript();
      rl.close();
      return;
    }
    
    // Si on choisit la méthode API, on continue avec les questions
    const deploymentUrl = await askDeploymentUrl();
    const authToken = await askAuthToken();
    
    if (!deploymentUrl || !authToken) {
      console.error('L\'URL de déploiement et le token d\'authentification sont requis.');
      process.exit(1);
    }
    
    const apiUrl = `${deploymentUrl}/api/migrations/add-quiz-attempts-table`;
    
    console.log(`\nExécution de la migration sur ${apiUrl}...`);
    
    try {
      // Exécuter la migration
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `supabase-auth-token=${authToken}`
        }
      });
      
      const result = await response.json();
      
      // Afficher la réponse complète pour le débogage
      console.log('\nRéponse du serveur:', JSON.stringify(result, null, 2));
      
      if (response.ok && result.success) {
        console.log('\n✅ Migration réussie ! La table quiz_attempts a été créée avec toutes les fonctionnalités associées.');
      } else {
        console.error('\n❌ Erreur lors de la migration :', result.error || 'Erreur inconnue');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Erreur lors de la requête :', error);
      console.log('\nVérifiez que l\'URL du déploiement est correcte et que le serveur est en cours d\'exécution.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erreur inattendue :', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Exécuter le script
main(); 