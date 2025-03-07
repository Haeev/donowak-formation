// Script pour exécuter la migration SQL sur la base de données Supabase
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Lire le fichier de migration
const migrationFile = path.join(__dirname, '../migrations/add_is_deleted_to_profiles.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

// Fonction pour exécuter la migration
async function runMigration() {
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
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de l'exécution de la migration: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    console.log('Migration exécutée avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
runMigration(); 