import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier si l'utilisateur est authentifié
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

    // Récupérer les données de la tentative
    const quizAttemptData = await req.json();
    
    // Validation des données requises
    const requiredFields = ['quiz_id', 'score', 'max_score', 'answers', 'total_questions'];
    for (const field of requiredFields) {
      if (!quizAttemptData[field]) {
        return NextResponse.json(
          { error: `Le champ '${field}' est requis` },
          { status: 400 }
        );
      }
    }
    
    // Calcul du nombre de réponses correctes (si non fourni)
    if (!quizAttemptData.correct_count && quizAttemptData.score) {
      // Estimation basique basée sur le score
      quizAttemptData.correct_count = Math.round(
        (quizAttemptData.score / quizAttemptData.max_score) * quizAttemptData.total_questions
      );
    }
    
    // Ajout de l'ID utilisateur
    quizAttemptData.user_id = user.id;
    
    // Enregistrement de la tentative
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert(quizAttemptData)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'enregistrement de la tentative:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de la tentative" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: "Tentative enregistrée avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la tentative:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Récupérer les tentatives pour un utilisateur spécifique
export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier si l'utilisateur est authentifié
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

    // Récupérer les paramètres de requête
    const url = new URL(req.url);
    const quizId = url.searchParams.get('quiz_id');
    const lessonId = url.searchParams.get('lesson_id');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Construire la requête
    let query = supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes (
          id,
          title,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Filtrer par quiz_id si fourni
    if (quizId) {
      query = query.eq('quiz_id', quizId);
    }
    
    // Filtrer par lesson_id si fourni
    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }
    
    // Exécuter la requête
    const { data, error } = await query;

    if (error) {
      console.error("Erreur lors de la récupération des tentatives:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des tentatives" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: "Tentatives récupérées avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tentatives:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
} 