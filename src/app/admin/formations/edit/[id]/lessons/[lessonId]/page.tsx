'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
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
import ContentEditor from '@/components/editor/ContentEditor';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

// Schéma de validation
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Le titre doit contenir au moins 3 caractères',
  }).max(100, {
    message: 'Le titre ne doit pas dépasser 100 caractères',
  }),
  description: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  duration: z.coerce.number().min(0, {
    message: 'La durée doit être supérieure ou égale à 0',
  }),
});

// Type pour les props de la page
type PageProps = {
  params: {
    id: string;
    lessonId: string;
  };
};

// Type pour les valeurs du formulaire
type FormValues = z.infer<typeof formSchema>;

/**
 * Page d'édition d'une leçon
 * Permet de modifier le contenu d'une leçon avec l'éditeur avancé
 */
export default function EditLessonPage({ params }: PageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [chapterInfo, setChapterInfo] = useState<{ title: string, id: string } | null>(null);
  const router = useRouter();
  
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      video_url: '',
      duration: 0,
    },
  });
  
  // Charger les données de la leçon
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        
        const supabase = createClient();
        
        // Récupérer les détails de la leçon
        const { data: lesson, error } = await supabase
          .from('lessons')
          .select('*, chapters!inner(*)')
          .eq('id', params.lessonId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!lesson) {
          toast({
            title: 'Erreur',
            description: 'Leçon non trouvée',
            variant: 'destructive',
          });
          router.push(`/admin/formations/edit/${params.id}`);
          return;
        }
        
        // Vérifier que la leçon appartient bien à une formation de l'utilisateur
        if (lesson.chapters.formation_id !== params.id) {
          toast({
            title: 'Erreur',
            description: 'Cette leçon n\'appartient pas à cette formation',
            variant: 'destructive',
          });
          router.push(`/admin/formations/edit/${params.id}`);
          return;
        }
        
        // Définir les informations du chapitre parent
        setChapterInfo({
          title: lesson.chapters.title,
          id: lesson.chapters.id,
        });
        
        // Mettre à jour le formulaire avec les valeurs de la leçon
        form.reset({
          title: lesson.title,
          description: lesson.description || '',
          video_url: lesson.video_url || '',
          duration: lesson.duration,
        });
        
        // Définir le contenu pour l'éditeur
        setContent(lesson.content);
        setOriginalContent(lesson.content);
      } catch (error) {
        console.error('Erreur lors du chargement de la leçon:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails de la leçon',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLesson();
  }, [params.id, params.lessonId, router, form]);
  
  // Gérer la soumission du formulaire
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const supabase = createClient();
      
      // Mettre à jour la leçon dans la base de données
      const { error } = await supabase
        .from('lessons')
        .update({
          title: values.title,
          description: values.description,
          content: content,
          video_url: values.video_url,
          duration: values.duration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.lessonId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Leçon mise à jour',
        description: 'La leçon a été mise à jour avec succès.',
      });
      
      // Sauvegarder le contenu comme contenu original
      setOriginalContent(content);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de la leçon.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Gérer le changement de contenu dans l'éditeur
  const handleContentChange = (html: string) => {
    setContent(html);
  };
  
  // Gérer l'annulation des modifications
  const handleCancel = () => {
    // Restaurer le contenu original
    setContent(originalContent);
    
    toast({
      title: 'Modifications annulées',
      description: 'Les modifications ont été annulées.',
    });
  };
  
  // Vérifier si le contenu a été modifié
  const hasContentChanged = content !== originalContent;
  const isDirty = form.formState.isDirty || hasContentChanged;
  
  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Chargement de la leçon...</p>
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
          <div>
            <h1 className="text-3xl font-bold">Éditer la leçon</h1>
            {chapterInfo && (
              <p className="text-muted-foreground">
                Chapitre: {chapterInfo.title}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || !isDirty}
          >
            Annuler
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || !isDirty}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4 mr-1" />
            Enregistrer
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Informations de la leçon */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informations de la leçon</CardTitle>
            <CardDescription>
              Informations générales sur la leçon
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
                        <Input placeholder="Titre de la leçon" {...field} />
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
                          placeholder="Description courte de la leçon"
                          className="resize-y"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Une brève description de ce que l'apprenant va découvrir
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la vidéo (facultative)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="URL de la vidéo (YouTube, Vimeo...)"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Vidéo principale de la leçon (sera affichée en haut)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (en minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="Durée estimée de la leçon"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Temps nécessaire pour compléter cette leçon
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Éditeur de contenu */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contenu de la leçon</CardTitle>
            <CardDescription>
              Créez le contenu de votre leçon avec l'éditeur avancé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentEditor
              initialContent={content}
              onChange={handleContentChange}
              placeholder="Commencez à rédiger le contenu de votre leçon..."
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 