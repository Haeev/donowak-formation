import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await getServerSession(authOptions);

    // Vérifier si l'utilisateur est connecté
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est un administrateur
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const formationId = searchParams.get('formationId') || null;

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * pageSize;

    // Initialiser le client Supabase
    const supabase = createClient();

    // Construire la requête de base
    let query = supabase
      .from('lesson_comments')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, avatar_url),
        lesson:lessons(id, title, chapter_id),
        lessons!inner(id, title, chapter_id, chapters!inner(id, formation_id, formations!inner(id, title)))
      `, 
      { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    if (status === 'pending') {
      query = query.eq('is_approved', false).eq('is_flagged', false);
    } else if (status === 'approved') {
      query = query.eq('is_approved', true);
    } else if (status === 'flagged') {
      query = query.eq('is_flagged', true);
    }

    if (formationId) {
      query = query.filter('lessons.chapters.formation_id', 'eq', formationId);
    }

    // Exécuter la requête avec pagination
    const { data: comments, error, count } = await query
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des commentaires' },
        { status: 500 }
      );
    }

    // Transformer les données pour inclure les informations de formation et leçon
    const transformedComments = comments.map((comment) => {
      const formation = comment.lessons?.chapters?.formations;
      
      return {
        ...comment,
        formation_title: formation?.title || null,
        lesson_title: comment.lesson?.title || null
      };
    });

    return NextResponse.json({
      comments: transformedComments,
      total: count || 0
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 