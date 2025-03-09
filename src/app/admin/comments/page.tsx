'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import {
  MessageSquare,
  MoreVertical,
  Check,
  X,
  Search,
  Flag,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  List,
} from 'lucide-react';

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
  formation_title?: string;
  lesson_title?: string;
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
}

const CommentsAdminPage = () => {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formationsOptions, setFormationsOptions] = useState<{ id: string; title: string }[]>([]);
  const [selectedFormation, setSelectedFormation] = useState('all');
  
  const PAGE_SIZE = 10;

  // Vérifier le rôle administrateur
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      window.location.href = '/';
    }
  }, [session, status]);

  // Charger les formations pour le filtre
  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const response = await fetch('/api/formations');
        if (response.ok) {
          const data = await response.json();
          setFormationsOptions(data.formations || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des formations:', error);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchFormations();
    }
  }, [session, status]);

  // Charger les commentaires
  useEffect(() => {
    const fetchComments = async () => {
      if (status !== 'authenticated' || session?.user?.role !== 'admin') return;
      
      setLoading(true);
      try {
        // Construction des paramètres de requête
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('pageSize', PAGE_SIZE.toString());
        
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        
        if (filterStatus !== 'all') {
          params.append('status', filterStatus);
        }
        
        if (selectedFormation !== 'all') {
          params.append('formationId', selectedFormation);
        }
        
        const response = await fetch(`/api/admin/comments?${params.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
          setTotalPages(Math.ceil(data.total / PAGE_SIZE) || 1);
        } else {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les commentaires',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les commentaires',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [currentPage, searchQuery, filterStatus, selectedFormation, session, status]);

  // Fonction pour approuver un commentaire
  const approveComment = async (commentId: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          isApproved: true,
          isFlagged: false,
          flagReason: null,
        }),
      });

      if (response.ok) {
        // Mettre à jour la liste des commentaires
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? { ...comment, is_approved: true, is_flagged: false, flag_reason: null }
              : comment
          )
        );
        
        toast({
          title: 'Succès',
          description: 'Commentaire approuvé avec succès',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'approuver le commentaire',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'approbation du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver le commentaire',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour rejeter un commentaire
  const rejectComment = async (commentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter ce commentaire ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Supprimer le commentaire de la liste
        setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
        
        toast({
          title: 'Succès',
          description: 'Commentaire rejeté avec succès',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de rejeter le commentaire',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors du rejet du commentaire:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le commentaire',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour résoudre un signalement
  const resolveFlag = async (commentId: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          isFlagged: false,
          flagReason: null,
        }),
      });

      if (response.ok) {
        // Mettre à jour la liste des commentaires
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? { ...comment, is_flagged: false, flag_reason: null }
              : comment
          )
        );
        
        toast({
          title: 'Succès',
          description: 'Signalement résolu avec succès',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de résoudre le signalement',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la résolution du signalement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de résoudre le signalement',
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
    if (!user) return 'Utilisateur inconnu';
    return `${user.first_name} ${user.last_name}`.trim() || 'Utilisateur inconnu';
  };

  // Générer les initiales pour l'avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Si le statut d'authentification est en cours de chargement
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas un administrateur
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gestion des commentaires</h1>

      {/* Filtres et recherche */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        
        <div className="w-[200px]">
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="flagged">Signalés</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-[250px]">
          <Select
            value={selectedFormation}
            onValueChange={setSelectedFormation}
          >
            <SelectTrigger>
              <SelectValue placeholder="Formation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
              {formationsOptions.map((formation) => (
                <SelectItem key={formation.id} value={formation.id}>
                  {formation.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tableau des commentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Commentaires
          </CardTitle>
          <CardDescription>
            Gérez les commentaires des utilisateurs sur les leçons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement des commentaires...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              Aucun commentaire trouvé avec les filtres actuels.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Formation / Leçon</TableHead>
                    <TableHead>Commentaire</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={comment.profile?.avatar_url || ''}
                              alt={formatUserName(comment.profile)}
                            />
                            <AvatarFallback>
                              {getInitials(formatUserName(comment.profile))}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {formatUserName(comment.profile)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {comment.formation_title || 'Formation inconnue'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.lesson_title || 'Leçon inconnue'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div 
                          className="max-w-[300px] truncate cursor-pointer text-sm" 
                          onClick={() => {
                            setSelectedComment(comment);
                            setDialogOpen(true);
                          }}
                        >
                          {comment.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">
                          {formatDate(comment.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {comment.is_flagged ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            Signalé
                          </Badge>
                        ) : comment.is_approved ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Approuvé
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedComment(comment);
                                setDialogOpen(true);
                              }}
                            >
                              <List className="h-4 w-4 mr-2" />
                              Voir le détail
                            </DropdownMenuItem>
                            {!comment.is_approved && (
                              <DropdownMenuItem onClick={() => approveComment(comment.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Approuver
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => rejectComment(comment.id)}>
                              <X className="h-4 w-4 mr-2" />
                              Rejeter
                            </DropdownMenuItem>
                            {comment.is_flagged && (
                              <DropdownMenuItem onClick={() => resolveFlag(comment.id)}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Résoudre le signalement
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de détails du commentaire */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du commentaire</DialogTitle>
            <DialogDescription>
              Voir et gérer le commentaire de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          
          {selectedComment && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedComment.profile?.avatar_url || ''}
                    alt={formatUserName(selectedComment.profile)}
                  />
                  <AvatarFallback>
                    {getInitials(formatUserName(selectedComment.profile))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{formatUserName(selectedComment.profile)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(selectedComment.created_at)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Leçon:</div>
                <div className="text-sm">
                  {selectedComment.formation_title || 'Formation inconnue'} / {selectedComment.lesson_title || 'Leçon inconnue'}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Commentaire:</div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {selectedComment.content}
                </div>
              </div>

              {selectedComment.is_flagged && (
                <div>
                  <div className="text-sm font-medium mb-1 text-destructive">Raison du signalement:</div>
                  <div className="p-3 bg-destructive/10 rounded-md text-sm">
                    {selectedComment.flag_reason || 'Aucune raison spécifiée'}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                {!selectedComment.is_approved && (
                  <Button 
                    variant="default" 
                    onClick={() => {
                      approveComment(selectedComment.id);
                      setDialogOpen(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    rejectComment(selectedComment.id);
                    setDialogOpen(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                {selectedComment.is_flagged && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resolveFlag(selectedComment.id);
                      setDialogOpen(false);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Résoudre le signalement
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentsAdminPage; 