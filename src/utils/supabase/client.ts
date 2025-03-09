import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Créer un client Supabase avec les clés publiques
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Les variables d\'environnement Supabase ne sont pas définies');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}; 