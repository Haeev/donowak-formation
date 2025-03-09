import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Route API pour exécuter les migrations SQL
 * Cette route lit les fichiers SQL dans le dossier migrations et les exécute
 * Nécessite une clé d'API pour l'authentification
 * 
 * @param request - La requête HTTP
 * @returns Réponse indiquant le succès ou l'échec des migrations
 */
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification avec une clé d'API simple
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    
    // Vérifier que la clé d'API est correcte (à remplacer par une vérification plus sécurisée en production)
    if (apiKey !== process.env.MIGRATIONS_API_KEY) {
      return NextResponse.json(
        { error: 'Clé d\'API invalide' },
        { status: 401 }
      );
    }
    
    // Créer le client admin Supabase
    const supabase = createAdminClient();
    
    // Lire les fichiers de migration
    const migrationsDir = path.join(process.cwd(), 'src', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Trier les fichiers pour les exécuter dans l'ordre
    
    console.log(`Exécution de ${migrationFiles.length} fichiers de migration...`);
    
    const results = [];
    
    // Exécuter chaque fichier de migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Exécution de la migration: ${file}`);
      
      try {
        // Exécuter le SQL
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.error(`Erreur lors de l'exécution de ${file}:`, error);
          results.push({
            file,
            success: false,
            error: error.message
          });
        } else {
          console.log(`Migration ${file} exécutée avec succès`);
          results.push({
            file,
            success: true
          });
        }
      } catch (error: any) {
        console.error(`Exception lors de l'exécution de ${file}:`, error);
        results.push({
          file,
          success: false,
          error: error.message || 'Erreur inconnue'
        });
      }
    }
    
    return NextResponse.json({
      message: 'Migrations exécutées',
      results
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de l\'exécution des migrations' },
      { status: 500 }
    );
  }
} 