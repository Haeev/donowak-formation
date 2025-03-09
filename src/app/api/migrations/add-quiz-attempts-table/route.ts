import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import fs from 'fs';
import path from 'path';

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

    // Exécuter le script SQL étape par étape
    
    // 1. Créer la table quiz_attempts
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        score FLOAT NOT NULL,
        max_score FLOAT NOT NULL,
        answers JSONB NOT NULL,
        lesson_id UUID,
        correct_count INT,
        total_questions INT,
        time_spent INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      );
    `;
    
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql_query: createTableQuery
    });

    if (createTableError) {
      console.error("Erreur lors de la création de la table quiz_attempts:", createTableError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la table: " + createTableError.message },
        { status: 500 }
      );
    }

    // 2. Créer les index
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON quiz_attempts(quiz_id);
      CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON quiz_attempts(user_id);
      CREATE INDEX IF NOT EXISTS quiz_attempts_lesson_id_idx ON quiz_attempts(lesson_id);
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

    // 3. Activer RLS et créer les politiques
    const createPoliciesQuery = `
      ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
      
      -- Les admins peuvent tout faire
      DROP POLICY IF EXISTS quiz_attempts_admin_policy ON quiz_attempts;
      CREATE POLICY quiz_attempts_admin_policy ON quiz_attempts
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        )
        WITH CHECK (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
      
      -- Les utilisateurs peuvent voir leurs propres tentatives
      DROP POLICY IF EXISTS quiz_attempts_select_policy ON quiz_attempts;
      CREATE POLICY quiz_attempts_select_policy ON quiz_attempts
        FOR SELECT USING (
          auth.uid() = user_id
        );
      
      -- Les utilisateurs peuvent créer leurs propres tentatives
      DROP POLICY IF EXISTS quiz_attempts_insert_policy ON quiz_attempts;
      CREATE POLICY quiz_attempts_insert_policy ON quiz_attempts
        FOR INSERT WITH CHECK (
          auth.uid() = user_id
        );
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

    // 4. Créer les vues pour les statistiques
    const createViewsQuery = `
      -- Vue pour les statistiques générales des quiz
      CREATE OR REPLACE VIEW quiz_statistics AS
      SELECT 
        q.id AS quiz_id,
        q.title AS quiz_title,
        q.category,
        COUNT(qa.id) AS attempt_count,
        AVG(qa.score / qa.max_score) * 100 AS average_score_percentage,
        MIN(qa.score / qa.max_score) * 100 AS min_score_percentage,
        MAX(qa.score / qa.max_score) * 100 AS max_score_percentage,
        AVG(qa.time_spent) AS average_time_spent
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      GROUP BY q.id, q.title, q.category;
      
      -- Vue pour les statistiques par utilisateur
      CREATE OR REPLACE VIEW user_quiz_statistics AS
      SELECT 
        qa.user_id,
        p.username,
        p.full_name,
        q.id AS quiz_id,
        q.title AS quiz_title,
        COUNT(qa.id) AS attempt_count,
        MAX(qa.score / qa.max_score) * 100 AS best_score_percentage,
        AVG(qa.score / qa.max_score) * 100 AS average_score_percentage,
        MIN(qa.created_at) AS first_attempt_date,
        MAX(qa.created_at) AS last_attempt_date
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN profiles p ON qa.user_id = p.id
      GROUP BY qa.user_id, p.username, p.full_name, q.id, q.title;
    `;
    
    const { error: createViewsError } = await supabase.rpc('exec_sql', {
      sql_query: createViewsQuery
    });

    if (createViewsError) {
      console.error("Erreur lors de la création des vues:", createViewsError);
      return NextResponse.json(
        { error: "Erreur lors de la création des vues: " + createViewsError.message },
        { status: 500 }
      );
    }

    // 5. Créer la fonction pour le classement
    const createFunctionQuery = `
      -- Fonction pour obtenir le classement d'un quiz
      CREATE OR REPLACE FUNCTION get_quiz_leaderboard(quiz_id_param UUID)
      RETURNS TABLE (
        rank BIGINT,
        user_id UUID,
        username TEXT,
        full_name TEXT,
        best_score FLOAT,
        best_score_percentage FLOAT,
        attempt_count BIGINT,
        best_time_spent INTEGER,
        last_attempt_date TIMESTAMP WITH TIME ZONE
      ) LANGUAGE plpgsql AS $$
      BEGIN
        RETURN QUERY
        WITH best_attempts AS (
          SELECT 
            qa.user_id,
            p.username,
            p.full_name,
            MAX(qa.score) AS best_score,
            MAX(qa.score / qa.max_score) * 100 AS best_score_percentage,
            COUNT(qa.id) AS attempt_count,
            MIN(qa.time_spent) AS best_time_spent,
            MAX(qa.created_at) AS last_attempt_date
          FROM quiz_attempts qa
          JOIN profiles p ON qa.user_id = p.id
          WHERE qa.quiz_id = quiz_id_param
          GROUP BY qa.user_id, p.username, p.full_name
        )
        SELECT
          ROW_NUMBER() OVER (
            ORDER BY 
              ba.best_score_percentage DESC, 
              ba.best_time_spent ASC NULLS LAST, 
              ba.attempt_count ASC,
              ba.last_attempt_date ASC
          ) AS rank,
          ba.user_id,
          ba.username,
          ba.full_name,
          ba.best_score,
          ba.best_score_percentage,
          ba.attempt_count,
          ba.best_time_spent,
          ba.last_attempt_date
        FROM best_attempts ba
        ORDER BY rank;
      END;
      $$;
    `;
    
    const { error: createFunctionError } = await supabase.rpc('exec_sql', {
      sql_query: createFunctionQuery
    });

    if (createFunctionError) {
      console.error("Erreur lors de la création de la fonction:", createFunctionError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la fonction: " + createFunctionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "La table quiz_attempts et les objets associés ont été créés avec succès."
    });
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    return NextResponse.json(
      { error: "Erreur lors de la migration: " + (error as Error).message },
      { status: 500 }
    );
  }
} 