'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { AlertTriangle, CheckCircle, MoreHorizontal, Search, Shield, ShieldAlert, ShieldCheck, Trash, UserCog, UserMinus, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Type pour les utilisateurs
interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

/**
 * Page de gestion des utilisateurs
 * Permet de voir, rechercher, promouvoir ou rétrograder des utilisateurs
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showDemoteDialog, setShowDemoteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const supabase = createClient();
  
  // Récupérer les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Obtenir l'utilisateur courant
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: currentUserData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setCurrentUser(currentUserData as User);
        }
        
        // Récupérer tous les utilisateurs
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setUsers(data as User[]);
        setFilteredUsers(data as User[]);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer la liste des utilisateurs.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Filtrer les utilisateurs en fonction de la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(query) || 
      (user.full_name && user.full_name.toLowerCase().includes(query))
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  // Promouvoir un utilisateur en administrateur
  const promoteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la promotion de l\'utilisateur');
      }
      
      // Mettre à jour la liste des utilisateurs
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, role: 'admin' } : user
        )
      );
      
      toast({
        title: 'Utilisateur promu',
        description: `${selectedUser.full_name || selectedUser.email} est maintenant administrateur.`,
        variant: 'default'
      });
      
      setShowPromoteDialog(false);
    } catch (error) {
      console.error('Erreur lors de la promotion de l\'utilisateur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Rétrograder un administrateur
  const demoteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/admin/demote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la rétrogradation de l\'utilisateur');
      }
      
      // Mettre à jour la liste des utilisateurs
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, role: 'user' } : user
        )
      );
      
      toast({
        title: 'Administrateur rétrogradé',
        description: `${selectedUser.full_name || selectedUser.email} n'est plus administrateur.`,
        variant: 'default'
      });
      
      setShowDemoteDialog(false);
    } catch (error) {
      console.error('Erreur lors de la rétrogradation de l\'utilisateur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
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
  
  // État de chargement
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez les comptes utilisateurs de la plateforme
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs</CardTitle>
            <div className="flex items-center">
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
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
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les comptes utilisateurs de la plateforme
          </p>
        </div>
        <Button>Créer un utilisateur</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
          <div className="flex items-center mt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher par nom ou email..."
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
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || user.email}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <UserCog className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.full_name || 'Utilisateur sans nom'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 flex items-center gap-1 w-fit">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Admin</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-800 dark:text-gray-200 flex items-center gap-1 w-fit">
                            <UserCog className="h-3.5 w-3.5" />
                            <span>Utilisateur</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.is_deleted ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <X className="h-3.5 w-3.5" />
                            <span>Supprimé</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Actif</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={user.id === currentUser?.id}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {user.role === 'user' ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowPromoteDialog(true);
                                }}
                                className="text-blue-600 dark:text-blue-400"
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                <span>Promouvoir en admin</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDemoteDialog(true);
                                }}
                                className="text-amber-600 dark:text-amber-400"
                                disabled={user.id === currentUser?.id}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                <span>Rétrograder</span>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
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
      
      {/* Dialogue de promotion */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Promouvoir en administrateur
            </DialogTitle>
            <DialogDescription>
              Cette action donnera à l'utilisateur des droits d'administration complets sur la plateforme.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name || selectedUser.email}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCog className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium">{selectedUser.full_name || 'Utilisateur sans nom'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</div>
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Attention</p>
              <p>
                Un administrateur a accès à toutes les données et fonctionnalités de la plateforme, y compris la possibilité de promouvoir d'autres utilisateurs en administrateurs.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPromoteDialog(false)}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={promoteUser}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              Confirmer la promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de rétrogradation */}
      <Dialog open={showDemoteDialog} onOpenChange={setShowDemoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Rétrograder l'administrateur
            </DialogTitle>
            <DialogDescription>
              Cette action retirera les droits d'administration à cet utilisateur.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name || selectedUser.email}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCog className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium">{selectedUser.full_name || 'Utilisateur sans nom'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>
                Cet utilisateur n'aura plus accès aux fonctionnalités d'administration et sera considéré comme un utilisateur standard.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDemoteDialog(false)}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={demoteUser}
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              Confirmer la rétrogradation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash className="h-5 w-5" />
              Supprimer l'utilisateur
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données associées à cet utilisateur seront supprimées.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name || selectedUser.email}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCog className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium">{selectedUser.full_name || 'Utilisateur sans nom'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</div>
              </div>
            </div>
          )}
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-semibold mb-1">Attention</p>
              <p>
                Cette action supprimera définitivement l'utilisateur et toutes ses données associées, y compris ses formations, sa progression et ses certificats.
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
              disabled={actionLoading}
              className="gap-2"
            >
              {actionLoading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 