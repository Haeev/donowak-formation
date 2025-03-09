'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, FileText, Plus, Save, Trash, ArrowUp, ArrowDown, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Schéma de validation pour le chapitre
const chapterSchema = z.object({
  title: z.string().min(3, {
    message: 'Le titre doit contenir au moins 3 caractères',
  }).max(100, {
    message: 'Le titre ne doit pas dépasser 100 caractères',
  }),
  description: z.string().max(500, {
    message: 'La description ne doit pas dépasser 500 caractères',
  }).optional(),
});

// Type pour le chapitre
type ChapterFormValues = z.infer<typeof chapterSchema>;

// Type pour les leçons
interface Lesson {
  id: string;
  title: string;
  description: string | null;
  position: number;
  duration: number;
  chapter_id: string;
  video_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Page d'édition d'un chapitre
 * Permet à l'administrateur de modifier un chapitre et gérer ses leçons
 */
export default function EditChapterPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const router = useRouter();
  const params = useParams();
  const formationId = params.id as string;
  const chapterId = params.chapterId as string;
  
  // Initialiser le formulaire
  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });
  
  // Charger les données du chapitre et des leçons
  useEffect(() => {
    const loadChapterData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Récupérer les données du chapitre
        const { data: chapter, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!chapter) {
          toast({
            title: 'Chapitre non trouvé',
            description: 'Le chapitre demandé n\'existe pas.',
            variant: 'destructive',
          });
          router.push(`/admin/formations/edit/${formationId}`);
          return;
        }
        
        // Mettre à jour les valeurs du formulaire
        form.reset({
          title: chapter.title,
          description: chapter.description || '',
        });
        
        // Récupérer les leçons du chapitre
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('chapter_id', chapterId)
          .order('position', { ascending: true });
        
        if (lessonError) {
          throw lessonError;
        }
        
        setLessons(lessonData || []);
      } catch (error) {
        console.error('Erreur lors du chargement du chapitre:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du chapitre.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (chapterId) {
      loadChapterData();
    }
  }, [chapterId, formationId, form, router]);
  
  // Soumettre le formulaire
  const onSubmit = async (values: ChapterFormValues) => {
    try {
      setIsSaving(true);
      const supabase = createClient();
      
      // Mettre à jour le chapitre
      const { error } = await supabase
        .from('chapters')
        .update({
          title: values.title,
          description: values.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapterId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Chapitre mis à jour',
        description: 'Le chapitre a été mis à jour avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du chapitre:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour du chapitre.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Créer une nouvelle leçon
  const createLesson = async () => {
    try {
      setIsSaving(true);
      const supabase = createClient();
      
      // Déterminer la position de la nouvelle leçon
      const nextPosition = lessons.length > 0 
        ? Math.max(...lessons.map(lesson => lesson.position)) + 1 
        : 1;
      
      // Créer la leçon
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          chapter_id: chapterId,
          title: 'Nouvelle leçon',
          description: 'Description de la leçon',
          content: '# Nouvelle leçon\n\nContenu de la leçon',
          position: nextPosition,
          duration: 0,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Ajouter la nouvelle leçon à la liste
        setLessons([...lessons, data[0]]);
        
        toast({
          title: 'Leçon créée',
          description: 'La leçon a été créée avec succès.',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de la leçon.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Supprimer une leçon
  const deleteLesson = async (lessonId: string) => {
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      setIsSaving(true);
      const supabase = createClient();
      
      // Supprimer la leçon
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la liste des leçons
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
      
      toast({
        title: 'Leçon supprimée',
        description: 'La leçon a été supprimée avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de la leçon.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Déplacer une leçon
  const moveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    try {
      setIsSaving(true);
      
      // Trouver l'index de la leçon à déplacer
      const lessonIndex = lessons.findIndex(lesson => lesson.id === lessonId);
      if (lessonIndex === -1) return;
      
      // Vérifier si le déplacement est possible
      if (
        (direction === 'up' && lessonIndex === 0) ||
        (direction === 'down' && lessonIndex === lessons.length - 1)
      ) {
        return;
      }
      
      // Calculer le nouvel index
      const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
      
      // Créer une copie du tableau des leçons
      const newLessons = [...lessons];
      
      // Échanger les positions
      const temp = newLessons[lessonIndex].position;
      newLessons[lessonIndex].position = newLessons[newIndex].position;
      newLessons[newIndex].position = temp;
      
      // Échanger les leçons
      [newLessons[lessonIndex], newLessons[newIndex]] = [newLessons[newIndex], newLessons[lessonIndex]];
      
      // Mettre à jour l'état local
      setLessons(newLessons);
      
      // Mettre à jour les positions dans la base de données
      const supabase = createClient();
      
      // Mettre à jour la première leçon
      await supabase
        .from('lessons')
        .update({ position: newLessons[lessonIndex].position })
        .eq('id', newLessons[lessonIndex].id);
      
      // Mettre à jour la deuxième leçon
      await supabase
        .from('lessons')
        .update({ position: newLessons[newIndex].position })
        .eq('id', newLessons[newIndex].id);
    } catch (error) {
      console.error('Erreur lors du déplacement de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du déplacement de la leçon.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Gérer la fin du glisser-déposer
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Si la position n'a pas changé
    if (source.index === destination.index) return;
    
    try {
      setIsSaving(true);
      
      // Créer une copie du tableau des leçons
      const newLessons = [...lessons];
      
      // Retirer la leçon de sa position actuelle
      const [movedLesson] = newLessons.splice(source.index, 1);
      
      // Insérer la leçon à sa nouvelle position
      newLessons.splice(destination.index, 0, movedLesson);
      
      // Mettre à jour les positions
      const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        position: index + 1,
      }));
      
      // Mettre à jour l'état local
      setLessons(updatedLessons);
      
      // Mettre à jour les positions dans la base de données
      const supabase = createClient();
      
      // Créer un tableau de promesses pour les mises à jour
      const updatePromises = updatedLessons.map(lesson =>
        supabase
          .from('lessons')
          .update({ position: lesson.position })
          .eq('id', lesson.id)
      );
      
      // Attendre que toutes les mises à jour soient terminées
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Erreur lors du réarrangement des leçons:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du réarrangement des leçons.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/formations/edit/${formationId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Édition du chapitre</h1>
        </div>
        <Button
          variant="default"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer le chapitre
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Modifiez les informations de base du chapitre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre du chapitre</FormLabel>
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
                        <FormLabel>Description (facultatif)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description du chapitre"
                            className="resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Une brève description des objectifs ou du contenu du chapitre
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Leçons du chapitre</CardTitle>
                <CardDescription>
                  Gérez les leçons de ce chapitre
                </CardDescription>
              </div>
              <Button onClick={createLesson} disabled={isSaving}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une leçon
              </Button>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Aucune leçon</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Ce chapitre ne contient pas encore de leçons. Commencez par en créer une.
                  </p>
                  <Button onClick={createLesson} disabled={isSaving}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une leçon
                  </Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="lessons">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {lessons.map((lesson, index) => (
                          <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="p-4 border rounded-lg hover:bg-secondary/10 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{lesson.title}</h3>
                                    {lesson.description && (
                                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        {lesson.description}
                                      </p>
                                    )}
                                    <div className="flex items-center mt-2 text-sm text-gray-500">
                                      <div className="flex items-center mr-4">
                                        <FileText className="h-3 w-3 mr-1" />
                                        <span>Contenu: {lesson.content ? 'Oui' : 'Non'}</span>
                                      </div>
                                      {lesson.video_url && (
                                        <div className="flex items-center mr-4">
                                          <ExternalLink className="h-3 w-3 mr-1" />
                                          <span>Vidéo: Oui</span>
                                        </div>
                                      )}
                                      <div className="flex items-center">
                                        <span>Durée: {lesson.duration} min</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => moveLesson(lesson.id, 'up')}
                                      disabled={index === 0 || isSaving}
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => moveLesson(lesson.id, 'down')}
                                      disabled={index === lessons.length - 1 || isSaving}
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteLesson(lesson.id)}
                                      disabled={isSaving}
                                    >
                                      <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <Link
                                        href={`/admin/formations/edit/${formationId}/lessons/${lesson.id}`}
                                      >
                                        Éditer
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center text-sm text-gray-500">
                <p>
                  Faites glisser les leçons pour réorganiser leur ordre. Cliquez sur "Éditer" pour accéder à l'éditeur complet de la leçon.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 