import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

/**
 * GET /api/lesson-stats
 * Récupérer les statistiques pour une leçon spécifique
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lessonId');
  const formationId = searchParams.get('formationId');
  
  // Vérifier si l'un des deux paramètres est fourni
  if (!lessonId && !formationId) {
    return NextResponse.json(
      { error: 'Le paramètre lessonId ou formationId est requis' },
      { status: 400 }
    );
  }
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier si l'utilisateur est connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur est administrateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();
    
    // Seuls les administrateurs peuvent voir les statistiques
    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé à accéder aux statistiques' },
        { status: 403 }
      );
    }
    
    let data;
    let error;
    
    // Récupérer les statistiques pour une leçon spécifique
    if (lessonId) {
      const result = await supabase
        .from('lesson_statistics')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();
      
      data = result.data;
      error = result.error;
    } 
    // Récupérer les statistiques pour toutes les leçons d'une formation
    else if (formationId) {
      // D'abord, récupérer toutes les leçons de la formation
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .in('chapter_id', (query) => {
          query
            .from('chapters')
            .select('id')
            .eq('formation_id', formationId);
        });
      
      if (lessonsError) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des leçons' },
          { status: 500 }
        );
      }
      
      // Récupérer les statistiques pour toutes ces leçons
      const lessonIds = lessons?.map(lesson => lesson.id) || [];
      
      if (lessonIds.length === 0) {
        return NextResponse.json({ stats: [] });
      }
      
      const result = await supabase
        .from('lesson_statistics')
        .select(`
          *,
          lesson:lessons(
            id,
            title,
            chapter_id,
            position,
            chapter:chapters(
              id,
              title,
              position
            )
          )
        `)
        .in('lesson_id', lessonIds)
        .order('lesson_id');
      
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des statistiques' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ stats: data || [] });
  } catch (err) {
    console.error('Erreur serveur:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lesson-stats
 * Enregistrer une activité sur une leçon
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lessonId, action, timeSpent, progress, position } = body;
    
    if (!lessonId || !action) {
      return NextResponse.json(
        { error: 'Les paramètres lessonId et action sont requis' },
        { status: 400 }
      );
    }
    
    // L'action doit être l'une des suivantes: 'view', 'start', 'progress', 'complete'
    const validActions = ['view', 'start', 'progress', 'complete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Action non valide. Les actions valides sont: ' + validActions.join(', ') },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier si l'utilisateur est connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Vérifier si la leçon existe
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'La leçon n\'existe pas' },
        { status: 400 }
      );
    }
    
    // Rechercher un tracking existant pour cet utilisateur et cette leçon
    const { data: existingTracking, error: trackingError } = await supabase
      .from('user_lesson_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let trackingId;
    
    // Créer un nouvel enregistrement ou mettre à jour l'existant
    if (action === 'view' || action === 'start' || !existingTracking) {
      // Créer un nouvel enregistrement de suivi
      const { data, error } = await supabase
        .from('user_lesson_tracking')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          start_time: new Date().toISOString(),
          total_time_seconds: timeSpent || null,
          completed: action === 'complete',
          progress_percentage: progress || 0,
          last_position: position || null,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de l\'ajout du suivi:', error);
        return NextResponse.json(
          { error: 'Erreur lors de l\'ajout du suivi' },
          { status: 500 }
        );
      }
      
      trackingId = data?.id;
    } else {
      // Mettre à jour l'enregistrement existant
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (action === 'complete') {
        updateData.completed = true;
        updateData.end_time = new Date().toISOString();
        updateData.progress_percentage = 100;
      }
      
      if (timeSpent !== undefined) {
        updateData.total_time_seconds = timeSpent;
      }
      
      if (progress !== undefined) {
        updateData.progress_percentage = progress;
      }
      
      if (position !== undefined) {
        updateData.last_position = position;
      }
      
      const { data, error } = await supabase
        .from('user_lesson_tracking')
        .update(updateData)
        .eq('id', existingTracking.id)
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la mise à jour du suivi:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du suivi' },
          { status: 500 }
        );
      }
      
      trackingId = data?.id;
    }
    
    // Les statistiques sont mises à jour automatiquement par le trigger
    return NextResponse.json({ success: true, trackingId });
  } catch (err) {
    console.error('Erreur serveur:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 