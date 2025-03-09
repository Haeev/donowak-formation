'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Type pour les formations
interface Formation {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Page de gestion des formations
 * Permet de voir, rechercher, créer, modifier et supprimer des formations
 */
export default function AdminFormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const supabase = createClient();
  
  // Récupérer les formations
  useEffect(() => {
    const fetchFormations = async () => {
      try {
        setLoading(true);
        
        // Récupérer toutes les formations
        const { data, error } = await supabase
          .from('formations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setFormations(data as Formation[]);
        setFilteredFormations(data as Formation[]);
      } catch (error) {
        console.error('Erreur lors de la récupération des formations:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer la liste des formations.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormations();
  }, []);
  
  // Filtrer les formations en fonction de la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFormations(formations);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = formations.filter(formation => 
      formation.title.toLowerCase().includes(query) || 
      formation.description.toLowerCase().includes(query)
    );
    
    setFilteredFormations(filtered);
  }, [searchQuery, formations]);
  
  // Supprimer une formation
  const deleteFormation = async () => {
    if (!selectedFormation) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('id', selectedFormation.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste des formations
      setFormations(prevFormations => 
        prevFormations.filter(formation => formation.id !== selectedFormation.id)
      );
      
      toast({
        title: 'Formation supprimée',
        description: `"${selectedFormation.title}" a été supprimée avec succès.`,
        variant: 'default'
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Erreur lors de la suppression de la formation:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de la formation.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Publier une formation
  const publishFormation = async () => {
    if (!selectedFormation) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('formations')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('id', selectedFormation.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste des formations
      setFormations(prevFormations => 
        prevFormations.map(formation => 
          formation.id === selectedFormation.id 
            ? { ...formation, published: true, updated_at: new Date().toISOString() } 
            : formation
        )
      );
      
      toast({
        title: 'Formation publiée',
        description: `"${selectedFormation.title}" est maintenant visible pour les utilisateurs.`,
        variant: 'default'
      });
      
      setShowPublishDialog(false);
    } catch (error) {
      console.error('Erreur lors de la publication de la formation:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la publication de la formation.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Dépublier une formation
  const unpublishFormation = async () => {
    if (!selectedFormation) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('formations')
        .update({ published: false, updated_at: new Date().toISOString() })
        .eq('id', selectedFormation.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste des formations
      setFormations(prevFormations => 
        prevFormations.map(formation => 
          formation.id === selectedFormation.id 
            ? { ...formation, published: false, updated_at: new Date().toISOString() } 
            : formation
        )
      );
      
      toast({
        title: 'Formation dépubliée',
        description: `"${selectedFormation.title}" n'est plus visible pour les utilisateurs.`,
        variant: 'default'
      });
      
      setShowUnpublishDialog(false);
    } catch (error) {
      console.error('Erreur lors de la dépublication de la formation:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la dépublication de la formation.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };
  
  // État de chargement
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion des formations</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez les formations disponibles sur la plateforme
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Formations</CardTitle>
            <div className="flex items-center">
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des formations</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les formations disponibles sur la plateforme
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/formations/create">
            <Plus className="h-4 w-4 mr-2" />
            Créer une formation
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Formations ({filteredFormations.length})</CardTitle>
          <div className="flex items-center mt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher par titre..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formation</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Aucune formation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFormations.map((formation) => (
                    <TableRow key={formation.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {formation.image_url ? (
                              <img
                                src={formation.image_url}
                                alt={formation.title}
                                className="h-12 w-12 object-cover"
                              />
                            ) : (
                              <BookOpen className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{formation.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {formation.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(formation.price)}</TableCell>
                      <TableCell>
                        {formation.published ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Publié</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Brouillon</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(formation.updated_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem asChild>
                              <Link href={`/formations/${formation.id}`} target="_blank" className="flex items-center">
                                <Eye className="h-4 w-4 mr-2" />
                                <span>Voir</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/formations/edit/${formation.id}`} className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                <span>Modifier</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            {formation.published ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedFormation(formation);
                                  setShowUnpublishDialog(true);
                                }}
                                className="text-amber-600 dark:text-amber-400"
                              >
                                <X className="h-4 w-4 mr-2" />
                                <span>Dépublier</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedFormation(formation);
                                  setShowPublishDialog(true);
                                }}
                                className="text-green-600 dark:text-green-400"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span>Publier</span>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFormation(formation);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogue de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash className="h-5 w-5" />
              Supprimer la formation
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Cette formation sera supprimée définitivement.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFormation && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {selectedFormation.image_url ? (
                  <img
                    src={selectedFormation.image_url}
                    alt={selectedFormation.title}
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  <BookOpen className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium">{selectedFormation.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(selectedFormation.price)}</div>
              </div>
            </div>
          )}
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-semibold mb-1">Attention</p>
              <p>
                Cette action supprimera définitivement la formation, ainsi que tous les chapitres et leçons associés.
                Les utilisateurs qui ont acheté cette formation n'y auront plus accès.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={deleteFormation}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de publication */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Publier la formation
            </DialogTitle>
            <DialogDescription>
              Cette formation sera visible par tous les utilisateurs et disponible à l'achat.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFormation && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {selectedFormation.image_url ? (
                  <img
                    src={selectedFormation.image_url}
                    alt={selectedFormation.title}
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  <BookOpen className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium">{selectedFormation.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(selectedFormation.price)}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={publishFormation}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              Publier la formation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de dépublication */}
      <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <X className="h-5 w-5" />
              Dépublier la formation
            </DialogTitle>
            <DialogDescription>
              Cette formation ne sera plus visible par les utilisateurs et ne pourra plus être achetée.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFormation && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {selectedFormation.image_url ? (
                  <img
                    src={selectedFormation.image_url}
                    alt={selectedFormation.title}
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  <BookOpen className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium">{selectedFormation.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(selectedFormation.price)}</div>
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p>
                Les utilisateurs qui ont déjà acheté cette formation pourront toujours y accéder, mais aucun nouvel utilisateur ne pourra l'acheter.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnpublishDialog(false)}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={unpublishFormation}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              Dépublier la formation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 