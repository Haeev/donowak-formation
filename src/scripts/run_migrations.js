import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Obtenir l'équivalent de __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur: Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies.');
  process.exit(1);
}

// Chemin vers le dossier des migrations
const migrationsDir = path.join(__dirname, '../migrations');

// Liste des fichiers de migration à exécuter dans l'ordre
const migrationFiles = [
  'create_sql_function.sql',
  'create_lesson_versions_table.sql',
  'create_lesson_comments_table.sql',
  'create_lesson_statistics_table.sql',
  'create_quizzes_table.sql',
  'create_quiz_attempts_table.sql',
  'create_exercises_table.sql',
  'create_exercise_attempts_table.sql'
];

// Fonction pour exécuter une requête SQL via l'API REST
async function executeSql(sql) {
  try {
    // Construire l'URL de l'API REST
    const apiUrl = `${supabaseUrl}/rest/v1/`;
    
    // Exécuter la requête SQL via l'API REST
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur lors de l\'exécution du SQL:', errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'exécution du SQL:', error.message);
    return false;
  }
}

// Fonction pour exécuter une migration SQL
async function runMigration(filePath) {
  try {
    console.log(`Exécution de la migration: ${filePath}`);
    
    // Lire le contenu du fichier SQL
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Exécuter le SQL via l'API REST
    const success = await executeSql(sqlContent);
    
    if (!success) {
      console.error(`Erreur lors de l'exécution de ${filePath}`);
      return false;
    }
    
    console.log(`Migration réussie: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la migration ${filePath}:`, error.message);
    return false;
  }
}

// Exécuter toutes les migrations dans l'ordre
async function runAllMigrations() {
  console.log('Début des migrations...');
  
  let success = true;
  
  for (const migrationFile of migrationFiles) {
    const filePath = path.join(migrationsDir, migrationFile);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.warn(`Le fichier de migration ${migrationFile} n'existe pas. Ignoré.`);
      continue;
    }
    
    // Exécuter la migration
    const migrationSuccess = await runMigration(filePath);
    
    if (!migrationSuccess) {
      success = false;
      console.error(`Échec de la migration ${migrationFile}. Arrêt du processus.`);
      break;
    }
  }
  
  if (success) {
    console.log('Toutes les migrations ont été exécutées avec succès.');
  } else {
    console.error('Certaines migrations ont échoué. Veuillez vérifier les erreurs ci-dessus.');
    process.exit(1);
  }
}

// Exécuter les migrations
runAllMigrations(); 