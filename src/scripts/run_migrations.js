import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Vérifier que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur : Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies');
  process.exit(1);
}

// Créer un client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Liste des fichiers de migration dans l'ordre d'exécution
const migrationFiles = [
  'setup.sql',                        // Schéma de base
  'create_lesson_versions_table.sql', // Versionnement des leçons
  'create_lesson_comments_table.sql', // Système de commentaires
  'create_lesson_statistics_table.sql' // Statistiques des leçons
];

/**
 * Exécute un fichier de migration SQL
 * @param {string} filename - Nom du fichier de migration
 * @returns {Promise<void>}
 */
async function runMigration(filename) {
  console.log(`Exécution de la migration : ${filename}...`);
  
  try {
    const filePath = path.join(process.cwd(), 'src', 'migrations', filename);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`Erreur : Le fichier ${filePath} n'existe pas`);
      return;
    }
    
    // Lire le contenu du fichier SQL
    const migration = fs.readFileSync(filePath, 'utf8');
    
    // Exécuter la migration
    const { error } = await supabase.sql(migration);
    
    if (error) {
      console.error(`Erreur lors de l'exécution de ${filename}:`, error);
    } else {
      console.log(`✅ Migration ${filename} exécutée avec succès`);
    }
  } catch (error) {
    console.error(`Erreur lors de l'exécution de ${filename}:`, error);
  }
}

/**
 * Exécute toutes les migrations dans l'ordre
 */
async function runAllMigrations() {
  console.log('Début de l\'exécution des migrations...');
  
  for (const file of migrationFiles) {
    await runMigration(file);
  }
  
  console.log('Toutes les migrations ont été exécutées');
}

// Exécuter les migrations
runAllMigrations()
  .then(() => {
    console.log('Migrations terminées');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  }); 