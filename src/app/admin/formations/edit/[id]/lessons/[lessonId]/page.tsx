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
import {
  ArrowLeft,
  Save,
  Plus,
  Video,
  Music,
  Image as ImageIcon,
  FileQuestion,
  ExternalLink,
  Loader2,
  Clock,
  FileText,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import ContentEditor from '@/components/editor/ContentEditor';
import QuizCreator, { Quiz } from '@/components/editor/QuizCreator';
import { v4 as uuidv4 } from 'uuid';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import QuizBlock from "@/components/editor/QuizBlock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Schéma de validation pour la leçon
const lessonSchema = z.object({
  title: z.string().min(3, {
    message: 'Le titre doit contenir au moins 3 caractères',
  }).max(100, {
    message: 'Le titre ne doit pas dépasser 100 caractères',
  }),
  description: z.string().max(500, {
    message: 'La description ne doit pas dépasser 500 caractères',
  }).optional(),
  duration: z.coerce.number().min(0, {
    message: 'La durée doit être supérieure ou égale à 0',
  }),
  video_url: z.string().url({ message: 'L\'URL de la vidéo n\'est pas valide' }).optional().or(z.literal('')),
  audio_url: z.string().url({ message: 'L\'URL du fichier audio n\'est pas valide' }).optional().or(z.literal('')),
});

// Type pour la leçon
type LessonFormValues = z.infer<typeof lessonSchema>;

// Type pour le media
type MediaType = 'video' | 'audio' | 'quiz';

// Type pour les versions de leçon
interface LessonVersion {
  id: string;
  version_number: number;
  created_at: string;
  change_summary: string | null;
  created_by: string | null;
}

/**
 * Page d'édition d'une leçon
 * Permet à l'administrateur de modifier une leçon avec éditeur de contenu riche, médias et quiz
 */
export default function EditLessonPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState<MediaType | null>(null);
  const [versions, setVersions] = useState<LessonVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<LessonVersion | null>(null);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [showQuizPreviews, setShowQuizPreviews] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const formationId = params.id as string;
  const lessonId = params.lessonId as string;
  
  // Initialiser le formulaire
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 0,
      video_url: '',
      audio_url: '',
    },
  });
  
  // Charger les données de la leçon
  useEffect(() => {
    const loadLessonData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Récupérer les données de la leçon
        const { data: lesson, error } = await supabase
          .from('lessons')
          .select('*, chapter:chapters(formation_id)')
          .eq('id', lessonId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!lesson) {
          toast({
            title: 'Leçon non trouvée',
            description: 'La leçon demandée n\'existe pas.',
            variant: 'destructive',
          });
          router.push(`/admin/formations/edit/${formationId}`);
          return;
        }
        
        // Vérifier que la leçon appartient bien à la formation
        if (lesson.chapter?.formation_id !== formationId) {
          toast({
            title: 'Accès non autorisé',
            description: 'Cette leçon n\'appartient pas à la formation spécifiée.',
            variant: 'destructive',
          });
          router.push(`/admin/formations/edit/${formationId}`);
          return;
        }
        
        // Mettre à jour les valeurs du formulaire
        form.reset({
          title: lesson.title,
          description: lesson.description || '',
          duration: lesson.duration || 0,
          video_url: lesson.video_url || '',
          audio_url: lesson.audio_url || '',
        });
        
        // Récupérer le contenu
        setContent(lesson.content || '');
        setOriginalContent(lesson.content || '');
        
        // Récupérer les quiz intégrés s'ils existent
        try {
          if (lesson.content && lesson.content.includes('QUIZ_DATA:')) {
            const quizRegex = /QUIZ_DATA:(\{.*?\}):QUIZ_DATA_END/g;
            const matches = [];
            let match;
            let contentCopy = lesson.content;
            
            while ((match = quizRegex.exec(contentCopy)) !== null) {
              matches.push(match);
            }
            
            const extractedQuizzes = matches.map(match => {
              try {
                return JSON.parse(match[1]);
              } catch (e) {
                console.error('Erreur lors du parsing du quiz:', e);
                return null;
              }
            }).filter(Boolean) as Quiz[];
            
            setQuizzes(extractedQuizzes);
          }
        } catch (e) {
          console.error('Erreur lors de l\'extraction des quiz:', e);
        }
        
        // Récupérer les versions de la leçon
        const { data: versionsData, error: versionsError } = await supabase
          .from('lesson_versions')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('version_number', { ascending: false });
        
        if (versionsError) {
          console.error('Erreur lors du chargement des versions:', versionsError);
        } else {
          setVersions(versionsData || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la leçon:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données de la leçon.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId, formationId, form, router]);
  
  // Soumettre le formulaire avec un résumé des modifications
  const onSubmit = async (values: LessonFormValues) => {
    try {
      // Ouvrir la boîte de dialogue pour saisir le résumé des modifications
      setIsVersionDialogOpen(true);
      return; // Arrêter l'exécution ici, le reste se fera dans saveWithChangeSummary
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de la leçon.',
        variant: 'destructive',
      });
    }
  };
  
  // Fonction pour sauvegarder avec un résumé des modifications
  const saveWithChangeSummary = async () => {
    try {
      setIsSaving(true);
      setIsVersionDialogOpen(false);
      
      const values = form.getValues();
      const supabase = createClient();
      
      // Préparation du contenu avec les quiz intégrés
      let finalContent = content;
      
      // Mettre à jour la leçon
      const { error } = await supabase
        .from('lessons')
        .update({
          title: values.title,
          description: values.description || null,
          content: finalContent,
          duration: values.duration,
          video_url: values.video_url || null,
          audio_url: values.audio_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lessonId);
      
      if (error) {
        throw error;
      }
      
      // Créer manuellement une version avec le résumé des modifications
      const { error: versionError } = await supabase
        .from('lesson_versions')
        .insert({
          lesson_id: lessonId,
          version_number: (versions.length > 0 ? versions[0].version_number + 1 : 1),
          title: values.title,
          description: values.description || null,
          content: finalContent,
          video_url: values.video_url || null,
          audio_url: values.audio_url || null,
          duration: values.duration,
          change_summary: changeSummary || 'Mise à jour de la leçon',
        });
      
      if (versionError) {
        console.error('Erreur lors de la création de la version:', versionError);
      }
      
      // Recharger les versions
      const { data: versionsData } = await supabase
        .from('lesson_versions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('version_number', { ascending: false });
      
      setVersions(versionsData || []);
      
      toast({
        title: 'Leçon mise à jour',
        description: 'La leçon a été mise à jour avec succès.',
      });
      
      // Mettre à jour le contenu original
      setOriginalContent(finalContent);
      setChangeSummary('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la leçon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de la leçon.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fonction pour restaurer une version
  const restoreVersion = async (version: LessonVersion) => {
    try {
      setIsSaving(true);
      setSelectedVersion(null);
      
      const supabase = createClient();
      
      // Récupérer les détails de la version
      const { data: versionDetails, error: versionError } = await supabase
        .from('lesson_versions')
        .select('*')
        .eq('id', version.id)
        .single();
      
      if (versionError) {
        throw versionError;
      }
      
      if (!versionDetails) {
        throw new Error('Version non trouvée');
      }
      
      // Mettre à jour le formulaire avec les données de la version
      form.reset({
        title: versionDetails.title,
        description: versionDetails.description || '',
        duration: versionDetails.duration,
        video_url: versionDetails.video_url || '',
        audio_url: versionDetails.audio_url || '',
      });
      
      // Mettre à jour le contenu
      setContent(versionDetails.content);
      
      // Extraire les quiz si nécessaire
      if (versionDetails.content.includes('QUIZ_DATA:')) {
        const quizRegex = /QUIZ_DATA:(\{.*?\}):QUIZ_DATA_END/g;
        const matches = [];
        let match;
        let contentCopy = versionDetails.content;
        
        while ((match = quizRegex.exec(contentCopy)) !== null) {
          matches.push(match);
        }
        
        const extractedQuizzes = matches.map(match => {
          try {
            return JSON.parse(match[1]);
          } catch (e) {
            console.error('Erreur lors du parsing du quiz:', e);
            return null;
          }
        }).filter(Boolean) as Quiz[];
        
        setQuizzes(extractedQuizzes);
      }
      
      toast({
        title: 'Version restaurée',
        description: `La version ${version.version_number} a été restaurée avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la restauration de la version:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la restauration de la version.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fonction pour prévisualiser une version
  const previewVersion = async (version: LessonVersion) => {
    try {
      setSelectedVersion(version);
      const supabase = createClient();
      
      // Récupérer les détails de la version
      const { data: versionDetails, error: versionError } = await supabase
        .from('lesson_versions')
        .select('*')
        .eq('id', version.id)
        .single();
      
      if (versionError) {
        throw versionError;
      }
      
      if (!versionDetails) {
        throw new Error('Version non trouvée');
      }
      
      // Stocker les détails pour prévisualisation
      setSelectedVersion(versionDetails);
    } catch (error) {
      console.error('Erreur lors de la prévisualisation de la version:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la prévisualisation de la version.',
        variant: 'destructive',
      });
    }
  };
  
  // Fonction pour formatter une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Fonction pour basculer l'affichage des prévisualisations de quiz
  const toggleQuizPreviews = () => {
    setShowQuizPreviews(!showQuizPreviews);
  };
  
  // Gérer le changement de contenu
  const handleContentChange = (html: string) => {
    setContent(html);
  };
  
  // Ajouter un nouveau quiz
  const handleAddQuiz = () => {
    setSelectedQuiz({
      id: uuidv4(),
      type: 'multiple-choice',
      question: '',
      options: [
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
      ],
      explanation: '',
      points: 1,
    });
    setIsEditingQuiz(false);
    setIsQuizDialogOpen(true);
  };
  
  // Éditer un quiz existant
  const handleEditQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsEditingQuiz(true);
    setIsQuizDialogOpen(true);
  };
  
  // Enregistrer un quiz
  const handleSaveQuiz = (quiz: Quiz) => {
    if (isEditingQuiz) {
      // Mettre à jour un quiz existant
      setQuizzes(quizzes.map(q => q.id === quiz.id ? quiz : q));
    } else {
      // Ajouter un nouveau quiz
      setQuizzes([...quizzes, quiz]);
      
      // Ajouter le quiz au contenu
      const quizPlaceholder = `<div class="quiz-container" data-quiz-id="${quiz.id}">
        <div class="quiz-placeholder">
          <h3>Quiz: ${quiz.question}</h3>
          <p>Ce quiz sera affiché ici lors de la visualisation de la leçon.</p>
        </div>
        <!-- QUIZ_DATA:${JSON.stringify(quiz)}:QUIZ_DATA_END -->
      </div>`;
      
      setContent(content + quizPlaceholder);
    }
    
    setIsQuizDialogOpen(false);
    setSelectedQuiz(null);
  };
  
  // Supprimer un quiz
  const handleDeleteQuiz = (quizId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      
      // Supprimer le quiz du contenu
      const quizRegexPattern = '<div class="quiz-container" data-quiz-id="' + quizId + '">([\\s\\S]*?)<!-- QUIZ_DATA:([\\s\\S]*?):QUIZ_DATA_END -->[\\s\\S]*?</div>';
      const quizRegex = new RegExp(quizRegexPattern);
      setContent(content.replace(quizRegex, ''));
    }
  };
  
  // Ajouter une vidéo YouTube
  const handleAddVideo = (url: string) => {
    form.setValue('video_url', url);
    setMediaDialogOpen(null);
  };
  
  // Ajouter un fichier audio
  const handleAddAudio = (url: string) => {
    form.setValue('audio_url', url);
    setMediaDialogOpen(null);
  };
  
  // Uploader un fichier
  const handleFileUpload = async (file: File, type: 'image' | 'audio' | 'video') => {
    try {
      setIsSaving(true);
      const supabase = createClient();
      
      // Vérifier le type de fichier
      const fileExt = file.name.split('.').pop() || '';
      let bucket = 'images';
      let folder = 'lessons';
      
      if (type === 'audio') {
        bucket = 'audio';
        folder = 'lessons';
      } else if (type === 'video') {
        bucket = 'videos';
        folder = 'lessons';
      }
      
      // Générer un nom de fichier unique
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      // Uploader le fichier
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`Erreur lors de l'upload du fichier: ${uploadError.message}`);
      }
      
      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      // Retourner l'URL
      return publicUrl;
    } catch (error) {
      console.error(`Erreur lors de l'upload du fichier:`, error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de l'upload du fichier.`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fonction pour remplacer les placeholders de quiz par des composants QuizBlock
  const renderContentWithQuizBlocks = (htmlContent: string) => {
    if (!htmlContent) return '';
    
    // Remplacer les placeholders de quiz par les composants QuizBlock
    const quizRegex = /<div class="quiz-container" data-quiz-id="([^"]+)">([\s\S]*?)<!-- QUIZ_DATA:([\s\S]*?):QUIZ_DATA_END -->([\s\S]*?)<\/div>/g;
    
    let lastIndex = 0;
    let parts = [];
    let match;
    
    // Cloner le contenu pour éviter les problèmes de référence
    let content = htmlContent;
    
    // Analyser le contenu pour trouver les quiz
    while ((match = quizRegex.exec(content)) !== null) {
      // Ajouter le contenu avant le quiz
      parts.push(content.substring(lastIndex, match.index));
      
      // Extraire l'ID du quiz et les données
      const quizId = match[1];
      const quizDataString = match[3];
      
      try {
        // Trouver le quiz correspondant dans la liste
        const quizData = JSON.parse(quizDataString);
        const quiz = quizzes.find(q => q.id === quizId) || quizData;
        
        // Ajouter un placeholder pour le quiz
        if (showQuizPreviews) {
          parts.push(`<div id="quiz-placeholder-${quizId}" class="quiz-placeholder"></div>`);
        } else {
          parts.push(`<div class="border-2 border-dashed border-primary/20 p-4 my-4 rounded-md">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span class="font-medium">Quiz: ${quiz.question || 'Sans titre'}</span>
            </div>
          </div>`);
        }
      } catch (e) {
        console.error('Erreur lors du parsing des données du quiz:', e);
        parts.push(match[0]); // Conserver le HTML original en cas d'erreur
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le reste du contenu
    parts.push(content.substring(lastIndex));
    
    return parts.join('');
  };

  // Fonction qui sera appelée après le rendu pour injecter les composants QuizBlock
  useEffect(() => {
    if (showQuizPreviews) {
      // Pour chaque quiz, trouver le placeholder et injecter le composant
      quizzes.forEach(quiz => {
        const placeholder = document.getElementById(`quiz-placeholder-${quiz.id}`);
        if (placeholder) {
          // Créer un élément temporaire pour injecter le composant
          const tempContainer = document.createElement('div');
          tempContainer.className = 'quiz-container';
          placeholder.appendChild(tempContainer);
          
          // Rendre le composant QuizBlock dans l'élément temporaire
          const quizBlock = document.createElement('div');
          quizBlock.innerHTML = `
            <div class="border-2 border-dashed border-primary/20 p-4 my-2 rounded-md">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span class="font-medium">Quiz: ${quiz.question || 'Sans titre'}</span>
                </div>
                <div>
                  <button class="text-xs text-primary hover:underline" onclick="document.dispatchEvent(new CustomEvent('editQuiz', { detail: '${quiz.id}' }))">
                    Éditer
                  </button>
                </div>
              </div>
            </div>
          `;
          tempContainer.appendChild(quizBlock);
        }
      });
      
      // Ajouter un écouteur d'événements pour les actions sur les quiz
      const handleEditQuiz = (event: CustomEvent<string>) => {
        const quizId = event.detail;
        const quiz = quizzes.find(q => q.id === quizId);
        if (quiz) {
          handleEditQuiz(quiz);
        }
      };
      
      document.addEventListener('editQuiz', handleEditQuiz as any);
      
      return () => {
        document.removeEventListener('editQuiz', handleEditQuiz as any);
      };
    }
  }, [quizzes, showQuizPreviews]);
  
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
          <h1 className="text-3xl font-bold">Édition de la leçon</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsVersionDialogOpen(true)}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer comme nouvelle version
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedVersion(versions[0])}
            disabled={versions.length === 0}
          >
            <Clock className="mr-2 h-4 w-4" />
            Historique des versions
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Modifiez les informations de base de la leçon
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
                        <FormLabel>Titre de la leçon</FormLabel>
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
                        <FormLabel>Description (facultatif)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description de la leçon"
                            className="resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Une brève description des objectifs ou du contenu de la leçon
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
                        <FormLabel>Durée (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Durée de la leçon"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Durée estimée pour compléter la leçon
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <FormLabel className="mb-2">Médias supplémentaires</FormLabel>
                      <div className="grid grid-cols-2 gap-4">
                        <Dialog open={mediaDialogOpen === 'video'} onOpenChange={(open) => !open && setMediaDialogOpen(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              type="button"
                              className="w-full"
                              onClick={() => setMediaDialogOpen('video')}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              {form.watch('video_url') ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajouter une vidéo</DialogTitle>
                              <DialogDescription>
                                Entrez l'URL d'une vidéo YouTube ou Vimeo
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <FormField
                                control={form.control}
                                name="video_url"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>URL de la vidéo</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <DialogFooter>
                              <Button 
                                type="button" 
                                onClick={() => setMediaDialogOpen(null)}
                              >
                                Enregistrer
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={mediaDialogOpen === 'audio'} onOpenChange={(open) => !open && setMediaDialogOpen(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              type="button"
                              className="w-full"
                              onClick={() => setMediaDialogOpen('audio')}
                            >
                              <Music className="h-4 w-4 mr-2" />
                              {form.watch('audio_url') ? 'Modifier l\'audio' : 'Ajouter un audio'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajouter un fichier audio</DialogTitle>
                              <DialogDescription>
                                Entrez l'URL d'un fichier audio ou uploadez-en un
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <FormField
                                control={form.control}
                                name="audio_url"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>URL du fichier audio</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="https://example.com/audio.mp3"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="text-center my-4">- OU -</div>
                              <div className="space-y-2">
                                <FormLabel>Uploader un fichier audio</FormLabel>
                                <Input
                                  type="file"
                                  accept="audio/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await handleFileUpload(file, 'audio');
                                      if (url) {
                                        form.setValue('audio_url', url);
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                type="button" 
                                onClick={() => setMediaDialogOpen(null)}
                              >
                                Enregistrer
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    {/* Afficher les médias ajoutés */}
                    <div className="space-y-2">
                      {form.watch('video_url') && (
                        <div className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center">
                            <Video className="h-4 w-4 mr-2 text-primary" />
                            <span className="text-sm truncate max-w-[180px]">
                              {form.watch('video_url')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => form.setValue('video_url', '')}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {form.watch('audio_url') && (
                        <div className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center">
                            <Music className="h-4 w-4 mr-2 text-primary" />
                            <span className="text-sm truncate max-w-[180px]">
                              {form.watch('audio_url')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => form.setValue('audio_url', '')}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <FormLabel className="mb-2">Quiz</FormLabel>
                      <Button 
                        variant="outline" 
                        type="button"
                        onClick={handleAddQuiz}
                      >
                        <FileQuestion className="h-4 w-4 mr-2" />
                        Ajouter un quiz
                      </Button>
                    </div>
                    
                    {/* Liste des quiz */}
                    {quizzes.length > 0 && (
                      <div className="space-y-2">
                        {quizzes.map((quiz) => (
                          <QuizBlock
                            key={quiz.id}
                            quiz={quiz}
                            onEdit={handleEditQuiz}
                            onDelete={handleDeleteQuiz}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Ajouter une section pour afficher les quiz */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quiz intégrés</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleQuizPreviews}
                >
                  {showQuizPreviews ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showQuizPreviews ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
              <CardDescription>
                Quiz intégrés dans cette leçon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Aucun quiz n'a encore été ajouté à cette leçon
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map(quiz => (
                    <QuizBlock
                      key={quiz.id}
                      quiz={quiz}
                      onEdit={handleEditQuiz}
                      onDelete={handleDeleteQuiz}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Contenu de la leçon</CardTitle>
              <CardDescription>
                Utilisez l'éditeur ci-dessous pour créer le contenu de votre leçon
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="editor">
                <TabsList className="w-full justify-start rounded-none border-b">
                  <TabsTrigger value="editor">Éditeur</TabsTrigger>
                  <TabsTrigger value="preview">Aperçu</TabsTrigger>
                </TabsList>
                <TabsContent value="editor" className="p-0">
                  <div className="p-4">
                    <ContentEditor
                      initialContent={content}
                      onChange={handleContentChange}
                      placeholder="Commencez à rédiger votre leçon ici..."
                      className="min-h-[500px]"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="p-4">
                  <div className="border rounded-md p-5 min-h-[500px] prose dark:prose-invert max-w-none">
                    {content ? (
                      <div dangerouslySetInnerHTML={{ 
                        __html: renderContentWithQuizBlocks(content) 
                      }} />
                    ) : (
                      <p className="text-gray-500">Aucun contenu à afficher</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog pour création/édition de quiz */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingQuiz ? 'Modifier le quiz' : 'Créer un nouveau quiz'}
            </DialogTitle>
            <DialogDescription>
              Créez un quiz interactif qui sera inséré dans votre leçon
            </DialogDescription>
          </DialogHeader>
          {selectedQuiz && (
            <QuizCreator
              initialQuiz={selectedQuiz}
              onSave={handleSaveQuiz}
              onCancel={() => setIsQuizDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog pour l'historique des versions */}
      <Dialog 
        open={selectedVersion !== null} 
        onOpenChange={(open) => !open && setSelectedVersion(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Historique des versions
            </DialogTitle>
            <DialogDescription>
              Visualisez et restaurez des versions précédentes de cette leçon
            </DialogDescription>
          </DialogHeader>
          
          {selectedVersion ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold mb-2">Version {selectedVersion.version_number}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Créée le {formatDate(selectedVersion.created_at)}
                </p>
                {selectedVersion.change_summary && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">Résumé des modifications : </span>
                    {selectedVersion.change_summary}
                  </p>
                )}
              </div>
              
              <div className="border rounded-md">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Aperçu du contenu</h3>
                </div>
                <div className="p-4 max-h-[50vh] overflow-y-auto prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedVersion.content || '' }} />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedVersion(null)}
                >
                  Fermer
                </Button>
                <Button
                  variant="default"
                  onClick={() => restoreVersion(selectedVersion)}
                >
                  Restaurer cette version
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <Table>
              <TableCaption>Historique des versions de cette leçon</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Résumé des modifications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>{version.version_number}</TableCell>
                    <TableCell>{formatDate(version.created_at)}</TableCell>
                    <TableCell>{version.change_summary || 'Aucun résumé'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewVersion(version)}
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog pour le résumé des modifications */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résumé des modifications</DialogTitle>
            <DialogDescription>
              Décrivez brièvement les modifications apportées à cette leçon
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="change-summary" className="text-sm font-medium">
                Résumé des modifications
              </label>
              <Textarea
                id="change-summary"
                placeholder="Décrivez vos modifications ici..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVersionDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={saveWithChangeSummary}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 