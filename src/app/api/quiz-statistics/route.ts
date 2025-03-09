import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

    // Récupérer les paramètres de requête
    const url = new URL(req.url);
    const quizId = url.searchParams.get('quiz_id');
    const userId = url.searchParams.get('user_id');
    const viewType = url.searchParams.get('view') || 'global'; // global, user, quiz
    
    let data;
    let error;
    
    // Statistiques globales par quiz
    if (viewType === 'global') {
      const query = supabase
        .from('quiz_statistics')
        .select('*');
      
      if (quizId) {
        query.eq('quiz_id', quizId);
      }
      
      ({ data, error } = await query);
    }
    // Statistiques par utilisateur
    else if (viewType === 'user') {
      const query = supabase
        .from('user_quiz_statistics')
        .select('*');
      
      if (userId) {
        query.eq('user_id', userId);
      }
      
      if (quizId) {
        query.eq('quiz_id', quizId);
      }
      
      ({ data, error } = await query);
    }
    // Tentatives détaillées pour un quiz spécifique
    else if (viewType === 'quiz' && quizId) {
      let query = supabase
        .from('quiz_attempts')
        .select(`
          *,
          profiles(id, username, full_name, email)
        `)
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      ({ data, error } = await query);
    }
    // Afficher les meilleurs scores pour chaque quiz
    else if (viewType === 'leaderboard' && quizId) {
      // Sous-requête pour obtenir le meilleur score de chaque utilisateur
      const { data: leaderboardData, error: leaderboardError } = await supabase.rpc(
        'get_quiz_leaderboard',
        { quiz_id_param: quizId }
      );
      
      data = leaderboardData;
      error = leaderboardError;
    }
    else {
      return NextResponse.json(
        { error: "Paramètres de requête invalides" },
        { status: 400 }
      );
    }

    if (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des statistiques" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: "Statistiques récupérées avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
} 