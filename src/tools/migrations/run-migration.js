#!/usr/bin/env node

/**
 * Script unifié pour exécuter les migrations SQL sur la base de données Supabase
 * 
 * Utilisation: 
 * - Avec un fichier SQL spécifique: node run-migration.js chemin/vers/fichier.sql
 * - Pour exécuter toutes les migrations: node run-migration.js --all
 * 
 * Nécessite les variables d'environnement:
 * - NEXT_PUBLIC_SUPABASE_URL: URL de l'instance Supabase
 * - SUPABASE_SERVICE_ROLE_KEY: Clé de service Supabase (service role key)
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Chemin vers le dossier des migrations
const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

// Fonction pour exécuter une migration SQL
async function executeSql(sql) {
  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises');
    process.exit(1);
  }
  
  try {
    console.log('Exécution de la migration SQL...');
    
    // Appeler l'API REST de Supabase pour exécuter la requête SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql_query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de l'exécution de la migration: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur:', error.message);
    return false;
  }
}

// Fonction pour exécuter une migration à partir d'un fichier
async function runMigrationFromFile(filePath) {
  try {
    console.log(`\nMigration: ${path.basename(filePath)}`);
    const migrationSQL = fs.readFileSync(filePath, 'utf8');
    
    const success = await executeSql(migrationSQL);
    if (success) {
      console.log(`✅ Migration ${path.basename(filePath)} exécutée avec succès`);
      return true;
    } else {
      console.error(`❌ Échec de la migration ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture ou de l'exécution du fichier ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour exécuter toutes les migrations dans le dossier
async function runAllMigrations() {
  try {
    console.log('Exécution de toutes les migrations SQL...');
    
    // Lire tous les fichiers SQL dans le dossier des migrations
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Trier pour s'assurer qu'ils sont exécutés dans l'ordre
    
    if (files.length === 0) {
      console.log('Aucun fichier de migration SQL trouvé dans', MIGRATIONS_DIR);
      return;
    }
    
    console.log(`Trouvé ${files.length} fichiers de migration SQL`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Exécuter chaque migration
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const success = await runMigrationFromFile(filePath);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log('\nRésumé des migrations:');
    console.log(`- ${successCount} migrations réussies`);
    console.log(`- ${failCount} migrations échouées`);
    
    if (failCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Erreur lors de l\'exécution de toutes les migrations:', error);
    process.exit(1);
  }
}

// Fonction principale
async function main() {
  const arg = process.argv[2];
  
  if (!arg) {
    console.log('Erreur: Argument manquant');
    console.log('Utilisation:');
    console.log('- Avec un fichier SQL spécifique: node run-migration.js chemin/vers/fichier.sql');
    console.log('- Pour exécuter toutes les migrations: node run-migration.js --all');
    process.exit(1);
  }
  
  if (arg === '--all') {
    await runAllMigrations();
  } else {
    // Vérifier si le chemin est absolu ou relatif
    const filePath = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
    
    if (!fs.existsSync(filePath)) {
      console.error(`Erreur: Le fichier ${filePath} n'existe pas`);
      process.exit(1);
    }
    
    const success = await runMigrationFromFile(filePath);
    if (!success) {
      process.exit(1);
    }
  }
}

// Exécuter le script
main(); 