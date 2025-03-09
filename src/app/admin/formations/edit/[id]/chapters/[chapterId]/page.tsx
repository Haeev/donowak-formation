'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  MoveVertical,
  BookOpen,
  MoreVertical,
  Pencil,
  Trash
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Schéma de validation
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Le titre doit contenir au moins 3 caractères',
  }).max(100, {
    message: 'Le titre ne doit pas dépasser 100 caractères',
  }),
  description: z.string().nullable().optional(),
  position: z.coerce.number().min(1, {
    message: 'La position doit être supérieure ou égale à 1',
  }),
});

// Type pour les props de la page
type PageProps = {
  params: {
    id: string;
    chapterId: string;
  };
};

// Type pour les valeurs du formulaire
type FormValues = z.infer<typeof formSchema>;

// Type pour les leçons
type Lesson = {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  content: string;
  video_url: string | null;
  position: number;
  duration: number;
  created_at: string;
  updated_at: string;
};

/**
 * Page d'édition d'un chapitre
 * Permet de modifier les informations d'un chapitre et de gérer ses leçons
 */
export default function EditChapterPage({ params }: PageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const router = useRouter();
  
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      position: 1,
    },
  });
  
  // Charger les données du chapitre
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true);
        
        const supabase = createClient();
        
        // Récupérer les détails du chapitre
        const { data: chapter, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', params.chapterId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!chapter) {
          toast({
            title: 'Erreur',
            description: 'Chapitre non trouvé',
            variant: 'destructive',
          });
          router.push(`/admin/formations/edit/${params.id}`);
          return;
        }
        
        // Vérifier que le chapitre appartient bien à la formation de l'utilisateur
        if (chapter.formation_id !== params.id) {
          toast({
            title: 'Erreur',
            description: 'Ce chapitre n\'appartient pas à cette formation',
            variant: 'destructive',
          });
          router.push(`/admin/formations/edit/${params.id}`);
          return;
        }
        
        // Mettre à jour le formulaire avec les valeurs du chapitre
        form.reset({
          title: chapter.title,
          description: chapter.description || '',
          position: chapter.position,
        });
        
        // Récupérer les leçons du chapitre
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('chapter_id', params.chapterId)
          .order('position', { ascending: true });
        
        if (lessonsError) {
          throw lessonsError;
        }
        
        setLessons(lessonsData || []);
      } catch (error) {
        console.error('Erreur lors du chargement du chapitre:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails du chapitre',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapter();
  }, [params.id, params.chapterId, router, form]);
  
  // Gérer la soumission du formulaire
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const supabase = createClient();
      
      // Mettre à jour le chapitre dans la base de données
      const { error } = await supabase
        .from('chapters')
        .update({
          title: values.title,
          description: values.description,
          position: values.position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.chapterId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Chapitre mis à jour',
        description: 'Le chapitre a été mis à jour avec succès.',
      });
      
      // Recharger le formulaire pour réinitialiser l'état "dirty"
      form.reset(values);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du chapitre:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour du chapitre.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Ajouter une nouvelle leçon
  const addLesson = async () => {
    try {
      setAddingLesson(true);
      
      const supabase = createClient();
      
      // Déterminer la position de la nouvelle leçon
      const position = lessons.length > 0 
        ? Math.max(...lessons.map(l => l.position)) + 1 
        : 1;
      
      // Créer la nouvelle leçon
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          chapter_id: params.chapterId,
          title: 'Nouvelle leçon',
          description: 'Description de la leçon',
          content: '<p>Contenu de la leçon</p>',
          position,
          duration: 0,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste des leçons
      setLessons([...lessons, data[0]]);
      
      toast({
        title: 'Leçon ajoutée',
        description: 'La leçon a été ajoutée avec succès.',
      });
      
      // Rediriger vers l'édition de la nouvelle leçon
      router.push(`/admin/formations/edit/${params.id}/lessons/${data[0].id}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'ajout de la leçon.',
        variant: 'destructive',
      });
    } finally {
      setAddingLesson(false);
    }
  };
  
  // Supprimer une leçon
  const deleteLesson = async () => {
    if (!lessonToDelete) return;
    
    try {
      setIsSubmitting(true);
      
      const supabase = createClient();
      
      // Supprimer la leçon
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste des leçons
      setLessons(lessons.filter(lesson => lesson.id !== lessonToDelete.id));
      
      toast({
        title: 'Leçon supprimée',
        description: 'La leçon a été supprimée avec succès.',
      });
      
      setConfirmDeleteOpen(false);
      setLessonToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de la leçon.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Formater la durée
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} h`;
    }
    
    return `${hours} h ${remainingMinutes} min`;
  };
  
  // Gérer l'annulation des modifications
  const handleCancel = () => {
    // Recharger la page
    router.refresh();
    
    toast({
      title: 'Modifications annulées',
      description: 'Les modifications ont été annulées.',
    });
  };
  
  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Chargement du chapitre...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/formations/edit/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Éditer le chapitre</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || !form.formState.isDirty}
          >
            Annuler
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || !form.formState.isDirty}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4 mr-1" />
            Enregistrer
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Informations du chapitre */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations du chapitre</CardTitle>
            <CardDescription>
              Informations générales sur le chapitre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre du chapitre" {...field} />
                      </FormControl>
                      <FormDescription>
                        Le titre doit être clair et concis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (facultative)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description du chapitre"
                          className="resize-y"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Une brève description du contenu du chapitre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="Position du chapitre"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Ordre d'affichage du chapitre (1 = premier)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Liste des leçons */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Leçons</CardTitle>
              <CardDescription>
                Leçons de ce chapitre ({lessons.length})
              </CardDescription>
            </div>
            <Button onClick={addLesson} disabled={addingLesson} className="gap-2">
              {addingLesson && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une leçon
            </Button>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Aucune leçon dans ce chapitre</p>
                <Button onClick={addLesson} disabled={addingLesson} className="gap-2">
                  {addingLesson && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une leçon
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 text-primary font-medium rounded-full w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(lesson.duration)}
                          {lesson.video_url && ' • Contient une vidéo'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/formations/edit/${params.id}/lessons/${lesson.id}`}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Éditer
                        </Link>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/formations/edit/${params.id}/lessons/${lesson.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              <span>Éditer</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => {
                              setLessonToDelete(lesson);
                              setConfirmDeleteOpen(true);
                            }}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            <span>Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette leçon ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La leçon et tout son contenu seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {lessonToDelete && (
            <div className="my-2 p-4 bg-muted rounded-md">
              <p className="font-medium">{lessonToDelete.title}</p>
              <p className="text-sm text-muted-foreground">{lessonToDelete.description}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteLesson();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 