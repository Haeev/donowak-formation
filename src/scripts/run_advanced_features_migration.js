import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

// Créer un client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Chemin vers le dossier des migrations
const migrationsDir = path.join(__dirname, '../migrations');

// Liste des fichiers de migration à exécuter dans l'ordre
const migrationFiles = [
  'create_lesson_versions_table.sql',
  'create_lesson_comments_table.sql',
  'create_lesson_statistics_table.sql',
  'create_quizzes_table.sql',
  'create_quiz_attempts_table.sql',
  'create_exercises_table.sql',
  'create_exercise_attempts_table.sql'
];

// Fonction pour exécuter la fonction SQL directement
async function executeSql(sql) {
  try {
    // Exécuter le SQL directement
    const { data, error } = await supabase.from('_sqlj').select('*').limit(1).then(() => {
      return supabase.rpc('exec_sql', { sql });
    });
    
    if (error) {
      console.error('Erreur lors de l\'exécution du SQL:', error);
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
    
    // Exécuter le SQL via la fonction exec_sql
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

// Fonction pour créer la fonction exec_sql
async function createExecSqlFunction() {
  try {
    console.log('Création de la fonction exec_sql...');
    
    // Lire le contenu du fichier SQL
    const filePath = path.join(migrationsDir, 'create_sql_function.sql');
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Exécuter le SQL directement
    const { error } = await supabase.rpc('pgmigrations_sql', { query: sqlContent });
    
    if (error) {
      // Si pgmigrations_sql n'existe pas, essayons d'exécuter directement le SQL
      try {
        // Créer une table temporaire pour exécuter le SQL
        const { error: tempError } = await supabase
          .from('_sqlj')
          .insert([{ id: 1 }]);
        
        if (tempError && !tempError.message.includes('already exists')) {
          console.error('Erreur lors de la création de la table temporaire:', tempError);
          return false;
        }
        
        // Exécuter le SQL via une requête SQL directe
        const { error: sqlError } = await supabase
          .from('_sqlj')
          .select('*')
          .eq('id', 1)
          .then(() => {
            // Exécuter chaque instruction SQL séparément
            const sqlStatements = sqlContent.split(';').filter(stmt => stmt.trim() !== '');
            
            return Promise.all(sqlStatements.map(async (stmt) => {
              if (stmt.trim() === '') return { error: null };
              return supabase.rpc('pgmigrations_sql', { query: stmt + ';' });
            }));
          });
        
        if (sqlError) {
          console.error('Erreur lors de l\'exécution du SQL:', sqlError);
          return false;
        }
      } catch (directError) {
        console.error('Erreur lors de l\'exécution directe du SQL:', directError);
        return false;
      }
    }
    
    console.log('Fonction exec_sql créée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de la fonction exec_sql:', error.message);
    return false;
  }
}

// Exécuter toutes les migrations dans l'ordre
async function runAllMigrations() {
  console.log('Début des migrations avancées...');
  
  // Créer d'abord la fonction exec_sql
  const execSqlCreated = await createExecSqlFunction();
  
  if (!execSqlCreated) {
    console.error('Échec de la création de la fonction exec_sql. Arrêt du processus.');
    process.exit(1);
  }
  
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