'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, ImagePlus, Loader2, Save, Eye, BookOpen, ListChecks, FilePlus2 } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

// Schéma de validation du formulaire
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Le titre doit contenir au moins 3 caractères',
  }).max(100, {
    message: 'Le titre ne doit pas dépasser 100 caractères',
  }),
  description: z.string().min(10, {
    message: 'La description doit contenir au moins 10 caractères',
  }).max(2000, {
    message: 'La description ne doit pas dépasser 2000 caractères',
  }),
  price: z.coerce.number().min(0, {
    message: 'Le prix doit être supérieur ou égal à 0',
  }).max(9999, {
    message: 'Le prix ne doit pas dépasser 9999€',
  }),
  level: z.string().optional(),
  duration: z.coerce.number().min(0, {
    message: 'La durée doit être supérieure ou égale à 0',
  }).default(0),
  published: z.boolean().default(false),
  image_url: z.string().optional(),
});

// Type inféré à partir du schéma
type FormValues = z.infer<typeof formSchema>;

// Type pour les chapitres
type Chapter = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  formation_id: string;
  created_at: string;
  updated_at: string;
  lessons_count?: number;
};

/**
 * Page d'édition d'une formation
 * Permet à l'administrateur de modifier une formation existante
 */
export default function AdminEditFormationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const router = useRouter();
  const params = useParams();
  const formationId = params.id as string;
  
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      level: 'débutant',
      duration: 0,
      published: false,
      image_url: '',
    },
  });
  
  // Charger les données de la formation
  useEffect(() => {
    const loadFormation = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Récupérer les données de la formation
        const { data: formation, error } = await supabase
          .from('formations')
          .select('*')
          .eq('id', formationId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!formation) {
          toast({
            title: 'Formation non trouvée',
            description: 'La formation demandée n\'existe pas.',
            variant: 'destructive',
          });
          router.push('/admin/formations');
          return;
        }
        
        // Mettre à jour les valeurs du formulaire
        form.reset({
          title: formation.title,
          description: formation.description,
          price: formation.price,
          level: formation.level || undefined,
          duration: formation.duration || 0,
          published: formation.published || false,
          image_url: formation.image_url || '',
        });
        
        // Mettre à jour la prévisualisation de l'image
        if (formation.image_url) {
          setPreviewUrl(formation.image_url);
        }
        
        // Récupérer les chapitres
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('formation_id', formationId)
          .order('position', { ascending: true });
        
        if (chaptersError) {
          throw chaptersError;
        }
        
        // Récupérer le nombre de leçons pour chaque chapitre
        if (chaptersData && chaptersData.length > 0) {
          const chaptersWithLessonCount = await Promise.all(
            chaptersData.map(async (chapter) => {
              const { count, error: lessonError } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('chapter_id', chapter.id);
              
              if (lessonError) {
                console.error('Erreur lors du comptage des leçons:', lessonError);
                return { ...chapter, lessons_count: 0 };
              }
              
              return { ...chapter, lessons_count: count || 0 };
            })
          );
          
          setChapters(chaptersWithLessonCount);
        } else {
          setChapters([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la formation:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données de la formation.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (formationId) {
      loadFormation();
    }
  }, [formationId, form, router]);
  
  // Gérer les changements dans le champ de l'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      setSelectedImage(file);
      
      // Créer une URL pour la prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };
  
  // Soumettre le formulaire
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true);
      
      const supabase = createClient();
      
      // Gérer l'upload de l'image si elle existe
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `formations/${fileName}`;
        
        // Uploader l'image
        const { error: uploadError, data } = await supabase.storage
          .from('images')
          .upload(filePath, selectedImage);
        
        if (uploadError) {
          throw new Error('Erreur lors de l\'upload de l\'image');
        }
        
        // Récupérer l'URL publique de l'image
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
        
        values.image_url = publicUrl;
      }
      
      // Mettre à jour la formation dans la base de données
      const { error } = await supabase
        .from('formations')
        .update({
          title: values.title,
          description: values.description,
          price: values.price,
          level: values.level || null,
          duration: values.duration || 0,
          published: values.published,
          image_url: values.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formationId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Formation mise à jour',
        description: 'La formation a été mise à jour avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la formation:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de la formation.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Créer un nouveau chapitre
  const handleCreateChapter = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Déterminer la position du nouveau chapitre
      const nextPosition = chapters.length > 0 
        ? Math.max(...chapters.map(chapter => chapter.position)) + 1 
        : 1;
      
      // Insérer le nouveau chapitre
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          formation_id: formationId,
          title: 'Nouveau chapitre',
          description: 'Description du chapitre',
          position: nextPosition,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        toast({
          title: 'Chapitre créé',
          description: 'Le chapitre a été créé avec succès.',
        });
        
        // Ajouter le nouveau chapitre à la liste
        setChapters([...chapters, { ...data[0], lessons_count: 0 }]);
      }
    } catch (error) {
      console.error('Erreur lors de la création du chapitre:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création du chapitre.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Publier ou dépublier la formation
  const togglePublishStatus = async () => {
    try {
      setIsSaving(true);
      const supabase = createClient();
      const currentStatus = form.getValues('published');
      
      // Mettre à jour le statut de publication
      const { error } = await supabase
        .from('formations')
        .update({
          published: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formationId);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour le formulaire
      form.setValue('published', !currentStatus);
      
      toast({
        title: !currentStatus ? 'Formation publiée' : 'Formation dépubliée',
        description: !currentStatus 
          ? 'La formation est maintenant accessible aux utilisateurs.' 
          : 'La formation est maintenant en mode brouillon.',
      });
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modification du statut de publication.',
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
            <Link href="/admin/formations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Édition de formation</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={form.getValues('published') ? "outline" : "default"}
            onClick={togglePublishStatus}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.getValues('published') ? 'Dépublier' : 'Publier'}
          </Button>
          <Button
            variant="default"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/formations/${formationId}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Aperçu
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">
            <ListChecks className="mr-2 h-4 w-4" />
            Informations générales
          </TabsTrigger>
          <TabsTrigger value="chapters">
            <BookOpen className="mr-2 h-4 w-4" />
            Chapitres et leçons ({chapters.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Modifiez les informations de base de la formation
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
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input placeholder="Titre de la formation" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description détaillée de la formation"
                              className="min-h-32 resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Décrivez le contenu et les objectifs de la formation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prix (€)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="Prix de la formation"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Entrez 0 pour une formation gratuite
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Niveau</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un niveau" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="débutant">Débutant</SelectItem>
                                <SelectItem value="intermédiaire">Intermédiaire</SelectItem>
                                <SelectItem value="avancé">Avancé</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Niveau de difficulté de la formation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="Durée de la formation"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Durée totale de la formation en minutes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Formation publiée</FormLabel>
                            <FormDescription>
                              Si cochée, la formation sera visible par les utilisateurs
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Image de couverture</CardTitle>
                <CardDescription>
                  Modifiez l'image de couverture de la formation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] ${
                    previewUrl ? 'border-primary/50 bg-primary/5' : 'border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative w-full max-w-full">
                      <img
                        src={previewUrl}
                        alt="Prévisualisation"
                        className="rounded-md max-h-[300px] mx-auto object-contain"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                          form.setValue('image_url', '');
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                    >
                      <ImagePlus className="h-12 w-12 text-gray-400" />
                      <span className="font-medium text-sm">Cliquez pour ajouter une image</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG ou WEBP jusqu'à 5MB
                      </span>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Recommandations :</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Format 16:9 pour un affichage optimal</li>
                    <li>Résolution minimale recommandée : 1280x720 pixels</li>
                    <li>Taille maximale : 5 MB</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="chapters">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Chapitres de la formation</CardTitle>
                <CardDescription>
                  Gérez les chapitres et les leçons de votre formation
                </CardDescription>
              </div>
              <Button onClick={handleCreateChapter} disabled={isLoading}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Ajouter un chapitre
              </Button>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Aucun chapitre</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Cette formation ne contient pas encore de chapitres. Commencez par en créer un.
                  </p>
                  <Button onClick={handleCreateChapter} disabled={isLoading}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Créer un chapitre
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {chapters.map((chapter) => (
                    <div 
                      key={chapter.id} 
                      className="p-4 border rounded-lg hover:bg-secondary/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{chapter.title}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {chapter.lessons_count} leçon(s)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/formations/edit/${formationId}/chapters/${chapter.id}`}>
                              Éditer le chapitre
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 