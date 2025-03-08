import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

/**
 * Crée et configure un client Supabase pour le navigateur
 * Utilise les variables d'environnement pour l'URL et la clé anonyme
 * 
 * À utiliser dans les composants côté client uniquement.
 * Pour les composants serveur, utilisez createClient() depuis @/lib/supabase/server.ts
 * 
 * Cette fonction utilise la clé anon/public qui a des permissions limitées
 * définies par les règles de sécurité (RLS) dans Supabase.
 * 
 * @returns Instance du client Supabase configurée pour le navigateur avec typage
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Variables d\'environnement Supabase manquantes:', { 
      url: supabaseUrl ? 'définie' : 'manquante', 
      key: supabaseAnonKey ? 'définie' : 'manquante' 
    });
    
    // Même en cas d'erreur, nous tentons de créer le client
    // car les erreurs sur le navigateur sont moins problématiques
    // que de bloquer complètement l'application
  }
  
  try {
    return createBrowserClient<Database>(
      supabaseUrl!,
      supabaseAnonKey!
    );
  } catch (error) {
    console.error('Erreur lors de la création du client Supabase:', error);
    // Renvoyer un client avec des valeurs par défaut pour éviter les erreurs
    // Cela permettra à l'application de continuer à fonctionner
    // même si les appels Supabase échoueront
    return createBrowserClient<Database>(
      supabaseUrl || 'https://fallback-url.supabase.co',
      supabaseAnonKey || 'fallback-key'
    );
  }
} 