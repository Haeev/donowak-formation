import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/exercise-attempts?lessonId=xxx
 * Récupère les tentatives d'exercices pour une leçon donnée
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Récupérer l'ID de la leçon depuis les paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'L\'ID de la leçon est requis' },
        { status: 400 }
      );
    }

    // Créer un client Supabase
    const supabase = await createClient();

    // Récupérer les tentatives d'exercices pour cette leçon
    const { data, error } = await supabase
      .rpc('get_user_exercise_attempts', { lesson_id_param: lessonId });

    if (error) {
      console.error('Erreur lors de la récupération des tentatives d\'exercices:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des tentatives d\'exercices' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur lors de la récupération des tentatives d\'exercices:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des tentatives d\'exercices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exercise-attempts
 * Enregistre une nouvelle tentative d'exercice
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour enregistrer une tentative d\'exercice' },
        { status: 401 }
      );
    }

    // Récupérer les données de la requête
    const body = await request.json();
    const { exercise_id, score, max_score, answers, lesson_id } = body;

    // Valider les données requises
    if (!exercise_id || score === undefined || !max_score || !lesson_id) {
      return NextResponse.json(
        { error: 'Données incomplètes pour l\'enregistrement de la tentative d\'exercice' },
        { status: 400 }
      );
    }

    // Créer un client Supabase
    const supabase = await createClient();

    // Enregistrer la tentative d'exercice
    const { data, error } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: session.user.id,
        exercise_id,
        score,
        max_score,
        answers,
        lesson_id
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement de la tentative d\'exercice:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la tentative d\'exercice' },
        { status: 500 }
      );
    }

    // Mettre à jour les statistiques de la leçon
    try {
      await fetch('/api/lesson-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson_id,
          action: 'exercise_complete',
        }),
      });
    } catch (statsError) {
      console.error('Erreur lors de la mise à jour des statistiques:', statsError);
      // Ne pas bloquer la réponse en cas d'erreur de statistiques
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la tentative d\'exercice:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'enregistrement de la tentative d\'exercice' },
      { status: 500 }
    );
  }
} 