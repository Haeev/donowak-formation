import fs from 'fs';
import path from 'path';

// Liste des fichiers de migration à traiter
const migrationFiles = [
  'create_lesson_versions_table.sql',
  'create_lesson_comments_table.sql',
  'create_lesson_statistics_table.sql'
];

// Fonction pour lire et formater une migration
function formatMigration(filename) {
  try {
    console.log(`Lecture du fichier: ${filename}`);
    
    // Lire le contenu du fichier
    const filePath = path.join(process.cwd(), 'src', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8')
      // Supprimer les caractères spéciaux à la fin s'ils existent
      .replace(/ %$/, '');
    
    return {
      filename,
      sql
    };
  } catch (err) {
    console.error(`Erreur lors de la lecture de ${filename}:`, err);
    return {
      filename,
      sql: null,
      error: err.message
    };
  }
}

// Fonction principale pour préparer toutes les migrations
function prepareAllMigrations() {
  console.log('Préparation des migrations pour les fonctionnalités avancées...\n');
  
  const results = [];
  
  for (const file of migrationFiles) {
    const result = formatMigration(file);
    results.push(result);
  }
  
  // Créer un fichier markdown avec les instructions
  let markdown = `# Instructions pour l'exécution des migrations\n\n`;
  markdown += `## Prérequis\n\n`;
  markdown += `1. Accédez à l'interface SQL de Supabase à l'adresse: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://votre-projet.supabase.co'}\n`;
  markdown += `2. Connectez-vous avec vos identifiants\n`;
  markdown += `3. Accédez à la section "SQL Editor"\n\n`;
  
  markdown += `## Migrations à exécuter\n\n`;
  markdown += `Exécutez les migrations suivantes dans l'ordre indiqué:\n\n`;
  
  // Ajouter chaque migration au fichier markdown
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    
    markdown += `### ${i + 1}. ${result.filename}\n\n`;
    
    if (result.sql) {
      markdown += `\`\`\`sql\n${result.sql}\n\`\`\`\n\n`;
    } else {
      markdown += `**ERREUR**: Le fichier n'a pas pu être lu - ${result.error}\n\n`;
    }
  }
  
  // Ajouter des instructions de vérification
  markdown += `## Vérification\n\n`;
  markdown += `Après avoir exécuté toutes les migrations, vérifiez que les tables ont été créées avec succès en exécutant la requête suivante:\n\n`;
  markdown += "```sql\nSELECT table_name \nFROM information_schema.tables \nWHERE table_schema = 'public' \nAND table_name IN ('lesson_versions', 'lesson_comments', 'lesson_statistics', 'user_lesson_tracking');\n```\n\n";
  
  // Écrire le fichier markdown
  const outputPath = path.join(process.cwd(), 'migrations_instructions.md');
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`Les instructions ont été générées dans le fichier: ${outputPath}`);
  console.log('Suivez les instructions dans ce fichier pour appliquer les migrations via l\'interface SQL de Supabase.');
}

// Exécuter la préparation
prepareAllMigrations(); 