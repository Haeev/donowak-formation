import { createClient } from '@supabase/supabase-js';
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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Liste des tables à vérifier
const tablesToCheck = [
  'lesson_versions',
  'lesson_comments',
  'lesson_statistics',
  'user_lesson_tracking'
];

// Fonction pour vérifier l'existence d'une table
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`Erreur lors de la vérification de la table ${tableName}:`, error);
      return false;
    }
    
    const exists = data && data.length > 0;
    console.log(`Table ${tableName}: ${exists ? 'Existe' : 'N\'existe pas'}`);
    return exists;
  } catch (err) {
    console.error(`Erreur lors de la vérification de la table ${tableName}:`, err);
    return false;
  }
}

// Fonction principale pour vérifier toutes les tables
async function checkAllTables() {
  console.log('Vérification des tables pour les fonctionnalités avancées...');
  
  const results = {};
  
  for (const table of tablesToCheck) {
    results[table] = await checkTableExists(table);
  }
  
  console.log('\nRésumé:');
  for (const [table, exists] of Object.entries(results)) {
    console.log(`- ${table}: ${exists ? '✅ Existe' : '❌ N\'existe pas'}`);
  }
  
  const allTablesExist = Object.values(results).every(exists => exists);
  
  if (allTablesExist) {
    console.log('\n✅ Toutes les tables existent. Les migrations ont déjà été appliquées avec succès.');
  } else {
    console.log('\n⚠️ Certaines tables n\'existent pas. Les migrations doivent être appliquées.');
    console.log('Veuillez exécuter ces migrations dans l\'interface SQL de Supabase dans cet ordre:');
    console.log('1. create_lesson_versions_table.sql');
    console.log('2. create_lesson_comments_table.sql');
    console.log('3. create_lesson_statistics_table.sql');
  }
}

// Exécuter les vérifications
checkAllTables(); 