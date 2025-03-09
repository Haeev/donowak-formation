import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier si l'utilisateur est authentifié et admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Créer la table quizzes si elle n'existe pas déjà
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        quiz_data JSONB NOT NULL,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        category TEXT,
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );
    `;
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql_query: createTableQuery
    });

    if (createTableError) {
      console.error("Erreur lors de la création de la table quizzes:", createTableError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la table: " + createTableError.message },
        { status: 500 }
      );
    }

    // Créer les index pour la table
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS quizzes_user_id_idx ON quizzes(user_id);
      CREATE INDEX IF NOT EXISTS quizzes_category_idx ON quizzes(category);
    `;
    
    const { error: createIndexError } = await supabase.rpc('exec_sql', {
      sql_query: createIndexQuery
    });

    if (createIndexError) {
      console.error("Erreur lors de la création des index:", createIndexError);
      return NextResponse.json(
        { error: "Erreur lors de la création des index: " + createIndexError.message },
        { status: 500 }
      );
    }

    // Activer RLS sur la table
    const enableRlsQuery = `
      ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: enableRlsError } = await supabase.rpc('exec_sql', {
      sql_query: enableRlsQuery
    });

    if (enableRlsError) {
      console.error("Erreur lors de l'activation de RLS:", enableRlsError);
      return NextResponse.json(
        { error: "Erreur lors de l'activation de RLS: " + enableRlsError.message },
        { status: 500 }
      );
    }

    // Créer les politiques RLS
    const createPoliciesQuery = `
      -- Les admins peuvent tout faire
      DROP POLICY IF EXISTS quizzes_admin_policy ON quizzes;
      CREATE POLICY quizzes_admin_policy ON quizzes
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        )
        WITH CHECK (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
      
      -- Les utilisateurs peuvent voir tous les quiz
      DROP POLICY IF EXISTS quizzes_select_policy ON quizzes;
      CREATE POLICY quizzes_select_policy ON quizzes
        FOR SELECT USING (true);
    `;
    
    const { error: createPoliciesError } = await supabase.rpc('exec_sql', {
      sql_query: createPoliciesQuery
    });

    if (createPoliciesError) {
      console.error("Erreur lors de la création des politiques:", createPoliciesError);
      return NextResponse.json(
        { error: "Erreur lors de la création des politiques: " + createPoliciesError.message },
        { status: 500 }
      );
    }

    // Créer des déclencheurs pour mettre à jour le champ updated_at
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
      CREATE TRIGGER update_quizzes_updated_at
      BEFORE UPDATE ON quizzes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    const { error: createTriggerError } = await supabase.rpc('exec_sql', {
      sql_query: createTriggerQuery
    });

    if (createTriggerError) {
      console.error("Erreur lors de la création du déclencheur:", createTriggerError);
      return NextResponse.json(
        { error: "Erreur lors de la création du déclencheur: " + createTriggerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "La table quizzes a été créée avec succès." 
    });
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    return NextResponse.json(
      { error: "Erreur lors de la migration: " + (error as Error).message },
      { status: 500 }
    );
  }
} 