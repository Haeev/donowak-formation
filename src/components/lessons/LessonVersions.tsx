'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import {
  History,
  Clock,
  User,
  ArrowDownUp,
  Eye,
  RotateCcw,
  Plus,
  Save
} from 'lucide-react';

// Types pour les versions
interface LessonVersion {
  id: string;
  lesson_id: string;
  version_number: number;
  content: any;
  title: string;
  created_at: string;
  created_by: string;
  change_summary: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface LessonVersionsProps {
  lessonId: string;
  currentContent: any;
  currentTitle: string;
  onRestoreVersion: (version: LessonVersion) => void;
  onPreviewVersion: (version: LessonVersion) => void;
}

const LessonVersions = ({
  lessonId,
  currentContent,
  currentTitle,
  onRestoreVersion,
  onPreviewVersion
}: LessonVersionsProps) => {
  const { data: session } = useSession();
  const [versions, setVersions] = useState<LessonVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedVersion, setSelectedVersion] = useState<LessonVersion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Initialiser le client Supabase
  const supabase = createClient();

  // Charger les versions
  useEffect(() => {
    const fetchVersions = async () => {
      if (!lessonId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lesson_versions')
          .select(`
            *,
            profile:profiles(first_name, last_name, email)
          `)
          .eq('lesson_id', lessonId)
          .order('version_number', { ascending: sortOrder === 'asc' });

        if (error) throw error;
        setVersions(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des versions:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les versions de la leçon',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [lessonId, sortOrder, supabase]);

  // Fonction pour créer une nouvelle version
  const createNewVersion = async () => {
    if (!lessonId || !session?.user?.id || !changeSummary.trim()) return;

    try {
      // Récupérer le numéro de la dernière version
      const { data: latestVersion, error: versionError } = await supabase
        .from('lesson_versions')
        .select('version_number')
        .eq('lesson_id', lessonId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

      // Créer la nouvelle version
      const { error } = await supabase
        .from('lesson_versions')
        .insert({
          lesson_id: lessonId,
          version_number: nextVersionNumber,
          content: currentContent,
          title: currentTitle,
          created_by: session.user.id,
          change_summary: changeSummary,
        });

      if (error) throw error;

      toast({
        title: 'Version créée',
        description: `La version ${nextVersionNumber} a été créée avec succès`,
      });

      // Recharger les versions
      const { data: updatedVersions, error: reloadError } = await supabase
        .from('lesson_versions')
        .select(`
          *,
          profile:profiles(first_name, last_name, email)
        `)
        .eq('lesson_id', lessonId)
        .order('version_number', { ascending: sortOrder === 'asc' });

      if (reloadError) throw reloadError;
      setVersions(updatedVersions || []);

      // Réinitialiser le formulaire
      setChangeSummary('');
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de la version:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la nouvelle version',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Fonction pour formater le nom d'utilisateur
  const formatUserName = (profile: any) => {
    if (!profile) return 'Utilisateur inconnu';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Utilisateur inconnu';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des versions
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1"
          >
            <ArrowDownUp className="h-4 w-4" />
            {sortOrder === 'asc' ? 'Plus récentes' : 'Plus anciennes'}
          </Button>
          <Button
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            Enregistrer la version actuelle
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement des versions...</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">
            Aucune version enregistrée pour cette leçon.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer la première version
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Résumé des modifications</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-medium">
                  {version.version_number}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatDate(version.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {formatUserName(version.profile)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-md truncate text-sm">
                    {version.change_summary}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedVersion(version);
                        setDialogOpen(true);
                      }}
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPreviewVersion(version)}
                      title="Prévisualiser"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRestoreVersion(version)}
                      title="Restaurer cette version"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialogue de détails de version */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Détails de la version {selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              Créée le {selectedVersion && formatDate(selectedVersion.created_at)} par{' '}
              {selectedVersion && formatUserName(selectedVersion.profile)}
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Titre:</h3>
                <div className="p-2 bg-muted rounded-md">
                  {selectedVersion.title}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Résumé des modifications:</h3>
                <div className="p-2 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedVersion.change_summary}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Contenu:</h3>
                <div className="max-h-96 overflow-y-auto p-2 bg-muted rounded-md">
                  {typeof selectedVersion.content === 'string' ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                  ) : (
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedVersion.content, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    onRestoreVersion(selectedVersion);
                    setDialogOpen(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurer cette version
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de création de version */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer une nouvelle version</DialogTitle>
            <DialogDescription>
              Créez un point de sauvegarde pour cette leçon avec un résumé des modifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="change-summary" className="text-sm font-medium">
                Résumé des modifications
              </label>
              <Textarea
                id="change-summary"
                placeholder="Décrivez les modifications apportées à cette version..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangeSummary('');
                setSaveDialogOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={createNewVersion}
              disabled={!changeSummary.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer la version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonVersions; 