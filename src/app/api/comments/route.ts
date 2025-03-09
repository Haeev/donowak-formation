import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

/**
 * GET /api/comments
 * Récupérer les commentaires pour une leçon spécifique
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lessonId');
  
  if (!lessonId) {
    return NextResponse.json(
      { error: 'Le paramètre lessonId est requis' },
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
    
    // Récupérer les commentaires pour cette leçon (commentaires principaux uniquement)
    const { data: comments, error } = await supabase
      .from('lesson_comments')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, avatar_url),
        replies:lesson_comments!parent_id(
          *,
          profile:profiles(id, first_name, last_name, avatar_url)
        )
      `)
      .eq('lesson_id', lessonId)
      .is('parent_id', null) // Commentaires principaux uniquement
      .eq('is_deleted', false) // Ne pas récupérer les commentaires supprimés
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des commentaires' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ comments });
  } catch (err) {
    console.error('Erreur serveur:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Ajouter un nouveau commentaire
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lessonId, content, parentId } = body;
    
    if (!lessonId || !content) {
      return NextResponse.json(
        { error: 'Les paramètres lessonId et content sont requis' },
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
    
    // Vérifier si le parent_id existe s'il est fourni
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('lesson_comments')
        .select('id')
        .eq('id', parentId)
        .single();
      
      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Le commentaire parent n\'existe pas' },
          { status: 400 }
        );
      }
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
    
    // Vérifier si l'utilisateur est administrateur pour auto-approuver
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = profile?.role === 'admin';
    
    // Ajouter le commentaire
    const { data: comment, error } = await supabase
      .from('lesson_comments')
      .insert({
        lesson_id: lessonId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
        is_approved: isAdmin, // Auto-approuver si c'est un admin
      })
      .select('*, profile:profiles(id, first_name, last_name, avatar_url)')
      .single();
    
    if (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout du commentaire' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ comment });
  } catch (err) {
    console.error('Erreur serveur:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/comments
 * Mettre à jour un commentaire (contenu ou statut)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId, content, isApproved, isFlagged, flagReason } = body;
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Le paramètre commentId est requis' },
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
    
    // Vérifier si l'utilisateur est administrateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = profile?.role === 'admin';
    
    // Récupérer le commentaire
    const { data: existingComment, error: commentError } = await supabase
      .from('lesson_comments')
      .select('user_id, is_approved')
      .eq('id', commentId)
      .single();
    
    if (commentError || !existingComment) {
      return NextResponse.json(
        { error: 'Le commentaire n\'existe pas' },
        { status: 404 }
      );
    }
    
    // Vérifier les droits d'édition
    if (!isAdmin && existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier ce commentaire' },
        { status: 403 }
      );
    }
    
    // Pour les non-admins, ils ne peuvent éditer que leurs propres commentaires non approuvés
    if (!isAdmin && existingComment.is_approved && content) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier un commentaire déjà approuvé' },
        { status: 403 }
      );
    }
    
    // Préparer les données à mettre à jour
    const updateData: any = {};
    
    if (content !== undefined) {
      updateData.content = content;
    }
    
    // Seuls les admins peuvent modifier ces champs
    if (isAdmin) {
      if (isApproved !== undefined) {
        updateData.is_approved = isApproved;
      }
      
      if (isFlagged !== undefined) {
        updateData.is_flagged = isFlagged;
      }
      
      if (flagReason !== undefined) {
        updateData.flag_reason = flagReason;
      }
    }
    
    // Mettre à jour le commentaire
    const { data: updatedComment, error } = await supabase
      .from('lesson_comments')
      .update(updateData)
      .eq('id', commentId)
      .select('*, profile:profiles(id, first_name, last_name, avatar_url)')
      .single();
    
    if (error) {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du commentaire' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ comment: updatedComment });
  } catch (err) {
    console.error('Erreur serveur:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments
 * Supprimer un commentaire (suppression logique)
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('commentId');
  
  if (!commentId) {
    return NextResponse.json(
      { error: 'Le paramètre commentId est requis' },
      { status: 400 }
    );
  }
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier si l'utilisateur est connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur est administrateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = profile?.role === 'admin';
    
    // Récupérer le commentaire
    const { data: existingComment, error: commentError } = await supabase
      .from('lesson_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();
    
    if (commentError || !existingComment) {
      return NextResponse.json(
        { error: 'Le commentaire n\'existe pas' },
        { status: 404 }
      );
    }
    
    // Vérifier les droits de suppression
    if (!isAdmin && existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce commentaire' },
        { status: 403 }
      );
    }
    
    // Pour les admins, suppression réelle, sinon suppression logique
    let result;
    
    if (isAdmin) {
      // Les admins peuvent vraiment supprimer
      result = await supabase
        .from('lesson_comments')
        .delete()
        .eq('id', commentId);
    } else {
      // Les utilisateurs normaux font une suppression logique
      result = await supabase
        .from('lesson_comments')
        .update({ is_deleted: true })
        .eq('id', commentId);
    }
    
    if (result.error) {
      console.error('Erreur lors de la suppression du commentaire:', result.error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du commentaire' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur serveur:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 