import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/migrations/add-image-url
 * Endpoint pour exécuter la migration qui ajoute la colonne image_url à la table formations
 * Nécessite une clé API pour authentification
 */
export async function POST(req: Request) {
  try {
    // Vérifier si la clé API est correcte
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.MIGRATIONS_API_KEY;
    
    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Clé API non valide ou manquante' },
        { status: 401 }
      );
    }
    
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'src', 'migrations', 'add_image_url_to_formations.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter la migration via Supabase
    const supabase = createClient();
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      console.error('Erreur lors de l\'exécution de la migration:', error);
      
      if (error.code === 'PGRST202') {
        // La fonction exec_sql n'existe probablement pas
        return NextResponse.json(
          { 
            error: 'La fonction exec_sql n\'existe pas dans la base de données.', 
            message: 'Veuillez exécuter la migration manuellement via l\'interface SQL de Supabase.',
            sql: migrationSql 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'La colonne image_url a été ajoutée à la table formations',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'exécution de la migration:', error);
    
    return NextResponse.json(
      { error: error.message || 'Une erreur s\'est produite' },
      { status: 500 }
    );
  }
} 