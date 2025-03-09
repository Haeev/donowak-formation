import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur: Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies.');
  process.exit(1);
}

// Créer un client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Liste des fichiers de migration à exécuter dans l'ordre
const migrationFiles = [
  'create_lesson_versions_table.sql',
  'create_lesson_comments_table.sql',
  'create_lesson_statistics_table.sql'
];

// Fonction pour exécuter une requête SQL directement
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erreur d\'authentification Supabase:', error);
      return false;
    }

    // Exécution directe de la requête SQL
    const result = await fetch(`${supabaseUrl}/rest/v1/`, {
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

    if (!result.ok) {
      const errorText = await result.text();
      console.error(`Erreur HTTP ${result.status}: ${errorText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erreur lors de l\'exécution SQL:', err);
    return false;
  }
}

// Fonction pour lire et exécuter une migration
async function runMigration(filename) {
  try {
    console.log(`Exécution de la migration: ${filename}`);
    
    // Lire le contenu du fichier
    const filePath = path.join(process.cwd(), 'src', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Exécuter le SQL
    const success = await executeSql(sql);
    
    if (!success) {
      console.error(`Erreur lors de l'exécution de ${filename}`);
      return false;
    }
    
    console.log(`Migration réussie: ${filename}`);
    return true;
  } catch (err) {
    console.error(`Erreur lors de la lecture ou de l'exécution de ${filename}:`, err);
    return false;
  }
}

// Fonction principale pour exécuter toutes les migrations
async function runAllMigrations() {
  console.log('Début des migrations pour les fonctionnalités avancées...');
  
  let success = true;
  
  for (const file of migrationFiles) {
    const result = await runMigration(file);
    if (!result) {
      success = false;
      console.error(`La migration ${file} a échoué.`);
    }
  }
  
  if (success) {
    console.log('Toutes les migrations ont été exécutées avec succès.');
  } else {
    console.error('Certaines migrations ont échoué. Vérifiez les erreurs ci-dessus.');
    process.exit(1);
  }
}

// Exécuter les migrations
runAllMigrations(); 