const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Erreur: Variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

// Créer un client Supabase avec la clé de service
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Liste des fichiers de migration dans l'ordre d'exécution
const migrationFiles = [
  'setup.sql',
  'create_lesson_versions_table.sql',
  'create_lesson_comments_table.sql',
  'create_lesson_statistics_table.sql'
];

// Fonction pour vérifier si une table existe
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .maybeSingle();
      
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error(`Erreur lors de la vérification de la table ${tableName}:`, error);
    return false;
  }
}

// Fonction pour exécuter un fichier de migration complet
async function runMigrationFile(filename) {
  console.log(`\n----- Exécution de la migration: ${filename} -----`);
  
  try {
    const filePath = path.join(process.cwd(), 'src', 'migrations', filename);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`Erreur: Le fichier ${filePath} n'existe pas`);
      return false;
    }
    
    // Lire le contenu du fichier SQL
    const migrationSql = fs.readFileSync(filePath, 'utf8');
    
    // Exécuter le fichier SQL via l'API REST de Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: migrationSql
      })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
    }
    
    console.log(`✅ Migration ${filename} exécutée avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de ${filename}:`, error);
    return false;
  }
}

// Fonction pour exécuter les migrations par ligne
async function runMigrationByLines(filename) {
  console.log(`\n----- Exécution séquentielle de la migration: ${filename} -----`);
  
  try {
    const filePath = path.join(process.cwd(), 'src', 'migrations', filename);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`Erreur: Le fichier ${filePath} n'existe pas`);
      return false;
    }
    
    // Lire le contenu du fichier SQL
    const migrationSql = fs.readFileSync(filePath, 'utf8');
    
    // Diviser le fichier en commandes séparées et nettoyer
    const commands = migrationSql
      .replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '') // Supprimer les commentaires
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
      .map(cmd => cmd + ';');
    
    // Exécuter chaque commande séparément
    let successCount = 0;
    let totalCommands = commands.length;
    
    for (let i = 0; i < totalCommands; i++) {
      const command = commands[i];
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({
            query: command
          })
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.warn(`⚠️ Commande ${i+1}/${totalCommands} échouée: ${errorText}`);
          // Continuer malgré l'erreur
        } else {
          successCount++;
        }
      } catch (error) {
        console.warn(`⚠️ Erreur avec la commande ${i+1}/${totalCommands}:`, error.message);
        // Continuer avec la commande suivante
      }
      
      // Afficher la progression
      if ((i+1) % 10 === 0 || i === totalCommands - 1) {
        console.log(`Progression: ${i+1}/${totalCommands} commandes`);
      }
    }
    
    console.log(`✅ Migration ${filename} terminée: ${successCount}/${totalCommands} commandes réussies`);
    return successCount > 0;
  } catch (error) {
    console.error(`❌ Erreur générale dans ${filename}:`, error);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Début de l\'exécution des migrations...');
  
  try {
    // 1. Vérifier d'abord si les tables nécessaires existent
    const hasLessons = await tableExists('lessons');
    
    if (!hasLessons) {
      console.log('⚠️ La table "lessons" n\'existe pas. Exécution du script initial...');
      
      // Exécuter setup.sql en premier
      const setupSuccess = await runMigrationByLines('setup.sql');
      if (!setupSuccess) {
        console.error('❌ Échec de la configuration initiale. Arrêt des migrations.');
        process.exit(1);
      }
    } else {
      console.log('✅ La table "lessons" existe déjà. Ignorer setup.sql.');
    }
    
    // 2. Exécuter les migrations avancées dans l'ordre
    for (const file of migrationFiles.slice(1)) { // Ignorer setup.sql qui a déjà été géré
      await runMigrationByLines(file);
    }
    
    console.log('\n✅ Toutes les migrations ont été tentées.');
  } catch (error) {
    console.error('❌ Erreur générale lors de l\'exécution des migrations:', error);
    process.exit(1);
  }
}

// Exécuter le programme
main()
  .then(() => {
    console.log('🎉 Processus de migration terminé!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 