'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  MessageSquarePlus,
  Reply,
  MoreVertical,
  Trash,
  Flag,
  Check,
  X,
  Edit,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types pour les commentaires
interface CommentAuthor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  parent_id: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  flag_reason: string | null;
  profile?: CommentAuthor;
  replies?: Comment[];
}

interface CommentsSectionProps {
  lessonId: string;
}

const CommentsSection = ({ lessonId }: CommentsSectionProps) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{
    commentId: string;
    userName: string;
    content: string;
  } | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Vérifier si l'utilisateur est administrateur
  const isAdmin = session?.user?.role === 'admin';

  // Récupérer les commentaires au chargement
  useEffect(() => {
    fetchComments();
  }, [lessonId]);

  // Fonction pour récupérer les commentaires
  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments?lessonId=${lessonId}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      } else {
        console.error('Erreur lors de la récupération des commentaires:', data.error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les commentaires.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commentaires.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour publier un commentaire
  const postComment = async (content: string, parentId?: string) => {
    if (!session?.user) {
      toast({
        title: 'Non connecté',
        description: 'Vous devez être connecté pour publier un commentaire.',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          content,
          parentId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Commentaire publié',
          description: isAdmin
            ? 'Votre commentaire a été publié.'
            : 'Votre commentaire a été soumis et sera visible après approbation.',
        });

        setNewComment('');
        setReplyTo(null);
        fetchComments(); // Recharger les commentaires
      } else {
        console.error('Erreur lors de la publication du commentaire:', data.error);
        toast({
          title: 'Erreur',
          description: 'Impossible de publier le commentaire.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la publication du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de publier le commentaire.',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour supprimer un commentaire
  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Commentaire supprimé',
          description: 'Le commentaire a été supprimé avec succès.',
        });
        fetchComments(); // Recharger les commentaires
      } else {
        console.error('Erreur lors de la suppression du commentaire:', data.error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le commentaire.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le commentaire.',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour signaler un commentaire
  const flagComment = async (commentId: string) => {
    const reason = window.prompt('Veuillez indiquer la raison du signalement:');
    if (reason === null) return; // L'utilisateur a annulé

    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          isFlagged: true,
          flagReason: reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Commentaire signalé',
          description: 'Le commentaire a été signalé et sera examiné par nos modérateurs.',
        });
        fetchComments(); // Recharger les commentaires
      } else {
        console.error('Erreur lors du signalement du commentaire:', data.error);
        toast({
          title: 'Erreur',
          description: 'Impossible de signaler le commentaire.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors du signalement du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de signaler le commentaire.',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour approuver un commentaire (admin uniquement)
  const approveComment = async (commentId: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          isApproved: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Commentaire approuvé',
          description: 'Le commentaire a été approuvé et est maintenant visible par tous.',
        });
        fetchComments(); // Recharger les commentaires
      } else {
        console.error('Erreur lors de l\'approbation du commentaire:', data.error);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'approuver le commentaire.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'approbation du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver le commentaire.',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour rejeter un commentaire (admin uniquement)
  const rejectComment = async (commentId: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Commentaire rejeté',
          description: 'Le commentaire a été rejeté et supprimé.',
        });
        fetchComments(); // Recharger les commentaires
      } else {
        console.error('Erreur lors du rejet du commentaire:', data.error);
        toast({
          title: 'Erreur',
          description: 'Impossible de rejeter le commentaire.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors du rejet du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le commentaire.',
        variant: 'destructive',
      });
    }
  };

  // Commencer à éditer un commentaire
  const startEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  // Annuler l'édition d'un commentaire
  const cancelEditComment = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Sauvegarder l'édition d'un commentaire
  const saveEditedComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          content: editContent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Commentaire mis à jour',
          description: 'Votre commentaire a été mis à jour avec succès.',
        });
        setEditingComment(null);
        setEditContent('');
        fetchComments(); // Recharger les commentaires
      } else {
        console.error('Erreur lors de la mise à jour du commentaire:', data.error);
        toast({
          title: 'Erreur',
          description: 'Impossible de mettre à jour le commentaire.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le commentaire.',
        variant: 'destructive',
      });
    }
  };

  // Formatter une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Formater le nom d'utilisateur
  const formatUserName = (user?: CommentAuthor) => {
    if (!user) return 'Utilisateur';
    return `${user.first_name} ${user.last_name}`.trim() || 'Utilisateur';
  };

  // Générer les initiales pour l'avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Rendu d'un commentaire et ses réponses
  const renderComment = (comment: Comment, isReply = false) => {
    // Ne pas afficher les commentaires supprimés
    if (comment.is_deleted) return null;

    // Ne pas afficher les commentaires non approuvés sauf pour leur auteur ou les admins
    if (!comment.is_approved && comment.user_id !== session?.user?.id && !isAdmin) {
      return null;
    }

    return (
      <div
        key={comment.id}
        className={`${
          isReply ? 'ml-8 mt-2' : 'mt-4'
        } border rounded-lg p-4 bg-card`}
      >
        <div className="flex items-start gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.profile?.avatar_url || ''}
              alt={formatUserName(comment.profile)}
            />
            <AvatarFallback>
              {getInitials(formatUserName(comment.profile))}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {formatUserName(comment.profile)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(comment.created_at)}
                  {comment.created_at !== comment.updated_at && ' (modifié)'}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {!isReply && (
                    <DropdownMenuItem
                      onClick={() =>
                        setReplyTo({
                          commentId: comment.id,
                          userName: formatUserName(comment.profile),
                          content: comment.content,
                        })
                      }
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Répondre
                    </DropdownMenuItem>
                  )}

                  {/* Options pour le propriétaire du commentaire */}
                  {comment.user_id === session?.user?.id && (
                    <>
                      <DropdownMenuItem onClick={() => startEditComment(comment)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteComment(comment.id)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Options pour tous les utilisateurs connectés */}
                  {comment.user_id !== session?.user?.id && (
                    <DropdownMenuItem onClick={() => flagComment(comment.id)}>
                      <Flag className="h-4 w-4 mr-2" />
                      Signaler
                    </DropdownMenuItem>
                  )}

                  {/* Options d'administration */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Administration</DropdownMenuLabel>
                      {!comment.is_approved && (
                        <DropdownMenuItem onClick={() => approveComment(comment.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Approuver
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => deleteComment(comment.id)}>
                        <X className="h-4 w-4 mr-2" />
                        Rejeter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Afficher le contenu ou l'éditeur */}
            {editingComment === comment.id ? (
              <div className="mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditComment}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveEditedComment(comment.id)}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</div>
            )}

            {/* Indicateurs de statut */}
            {!comment.is_approved && (
              <p className="text-xs text-amber-500 mt-2">
                En attente d'approbation
              </p>
            )}
            {comment.is_flagged && (
              <p className="text-xs text-red-500 mt-2">
                Commentaire signalé
                {isAdmin && comment.flag_reason && `: "${comment.flag_reason}"`}
              </p>
            )}
          </div>
        </div>

        {/* Réponses au commentaire */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}

        {/* Formulaire de réponse */}
        {replyTo?.commentId === comment.id && (
          <div className="mt-4 ml-8">
            <div className="bg-muted p-2 rounded mb-2 text-xs">
              <p className="font-medium">
                Réponse à {replyTo.userName}
              </p>
              <p className="line-clamp-2">
                {replyTo.content}
              </p>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Votre réponse..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-20"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => postComment(newComment, replyTo.commentId)}
                disabled={!newComment.trim()}
              >
                Répondre
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Commentaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Formulaire de commentaire */}
        {session?.user ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={(session.user as any).image || ''}
                  alt={session.user.name || 'Utilisateur'}
                />
                <AvatarFallback>
                  {getInitials(session.user.name || 'Utilisateur')}
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-20"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => postComment(newComment)}
                disabled={!newComment.trim()}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Publier
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 border rounded">
            <p>Vous devez être connecté pour publier un commentaire.</p>
          </div>
        )}

        {/* Liste des commentaires */}
        <div className="mt-8">
          {isLoading ? (
            <div className="text-center p-8">
              <p>Chargement des commentaires...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center p-8 border rounded">
              <p>Aucun commentaire pour le moment. Soyez le premier à commenter!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          Les commentaires sont modérés. Merci de respecter les règles de bonne conduite.
        </p>
      </CardFooter>
    </Card>
  );
};

export default CommentsSection; 