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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Liste des fichiers de migration à exécuter
const migrationFiles = [
  'create_exercise_attempts_table.sql'
];

// Fonction pour lire et exécuter une migration
async function runMigration(filename) {
  try {
    console.log(`Exécution de la migration: ${filename}`);
    
    // Lire le contenu du fichier
    const filePath = path.join(process.cwd(), 'src', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Exécuter le SQL directement
    const { error } = await supabase.from('_migrations').insert({
      name: filename,
      sql: sql,
      executed_at: new Date().toISOString()
    });
    
    if (error) {
      // Si la table _migrations n'existe pas, créons-la
      if (error.code === '42P01') {
        console.log('Création de la table _migrations...');
        await supabase.auth.admin.createUser({
          email: 'admin@example.com',
          password: 'password',
          email_confirm: true,
          user_metadata: { name: 'Admin User' }
        });
        
        // Exécuter le SQL directement via l'API REST
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: sql
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Erreur lors de l'exécution de ${filename}:`, errorData);
          return false;
        }
      } else {
        console.error(`Erreur lors de l'enregistrement de la migration ${filename}:`, error);
        return false;
      }
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