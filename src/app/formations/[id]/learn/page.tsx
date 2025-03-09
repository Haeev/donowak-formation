'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createClient } from '@/utils/supabase/client';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import CommentsSection from '@/components/lessons/CommentsSection';
import LessonStatistics from '@/components/lessons/LessonStatistics';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  Clock,
  MessageSquare,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Download
} from 'lucide-react';

// Types pour les données
interface Formation {
  id: string;
  title: string;
  description: string;
  content: any;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  position: number;
  formation_id: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: any;
  position: number;
  chapter_id: string;
  duration: number;
  is_completed?: boolean;
}

interface UserProgress {
  lesson_id: string;
  is_completed: boolean;
  last_position?: number;
  time_spent?: number;
}

const LearnPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [trackingTimer, setTrackingTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const formationId = params?.id as string;

  // Vérifier si c'est un aperçu
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setIsPreview(searchParams.get('preview') === 'true');
  }, []);

  // Initialiser le client Supabase
  const supabase = createClient();

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated' && !isPreview) {
      router.push(`/formations/${formationId}`);
    }
  }, [status, router, formationId, isPreview]);

  // Charger les données de la formation et des chapitres
  useEffect(() => {
    const fetchFormationData = async () => {
      if (!formationId) return;
      if (status !== 'authenticated' && !isPreview) return;

      setLoading(true);
      try {
        // Récupérer la formation
        const { data: formationData, error: formationError } = await supabase
          .from('formations')
          .select('*')
          .eq('id', formationId)
          .single();

        if (formationError) throw formationError;
        setFormation(formationData);

        // Récupérer les chapitres et les leçons
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select(`
            *,
            lessons (
              *
            )
          `)
          .eq('formation_id', formationId)
          .order('position', { ascending: true });

        if (chaptersError) throw chaptersError;

        // Trier les leçons par position
        const sortedChapters = chaptersData.map(chapter => ({
          ...chapter,
          lessons: chapter.lessons.sort((a: Lesson, b: Lesson) => a.position - b.position)
        }));

        setChapters(sortedChapters);

        // En mode aperçu, afficher seulement la première leçon
        if (isPreview && sortedChapters.length > 0 && sortedChapters[0].lessons.length > 0) {
          setCurrentLesson(sortedChapters[0].lessons[0]);
          setLoading(false);
          return;
        }

        // Récupérer la progression de l'utilisateur si authentifié
        if (status === 'authenticated' && session?.user?.id) {
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('formation_id', formationId);

          if (progressError) throw progressError;
          setUserProgress(progressData || []);

          // Définir la leçon actuelle (première non complétée ou première)
          if (sortedChapters.length > 0 && sortedChapters[0].lessons.length > 0) {
            let foundCurrentLesson = false;
            
            // Parcourir les chapitres et les leçons pour trouver la première leçon non complétée
            for (const chapter of sortedChapters) {
              for (const lesson of chapter.lessons) {
                const progress = progressData?.find(p => p.lesson_id === lesson.id);
                
                if (!progress || !progress.is_completed) {
                  setCurrentLesson(lesson);
                  foundCurrentLesson = true;
                  break;
                }
              }
              if (foundCurrentLesson) break;
            }
            
            // Si toutes les leçons sont complétées, définir la première leçon comme actuelle
            if (!foundCurrentLesson) {
              setCurrentLesson(sortedChapters[0].lessons[0]);
            }
          }
        } else if (sortedChapters.length > 0 && sortedChapters[0].lessons.length > 0) {
          // Si non authentifié, définir la première leçon comme actuelle
          setCurrentLesson(sortedChapters[0].lessons[0]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données de la formation',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFormationData();
  }, [formationId, supabase, session, status, isPreview]);

  // Démarrer le suivi du temps passé sur la leçon
  useEffect(() => {
    if (currentLesson && isPlaying) {
      // Enregistrer l'action "view" pour les statistiques
      const trackView = async () => {
        try {
          await fetch('/api/lesson-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lessonId: currentLesson.id,
              action: 'view',
            }),
          });
        } catch (error) {
          console.error('Erreur lors du suivi de la vue:', error);
        }
      };
      
      trackView();
      
      // Démarrer le timer pour suivre le temps passé
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      
      setTrackingTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else if (trackingTimer) {
      clearInterval(trackingTimer);
    }
  }, [currentLesson, isPlaying]);

  // Mettre à jour la progression toutes les 30 secondes
  useEffect(() => {
    if (timeSpent > 0 && timeSpent % 30 === 0 && currentLesson) {
      updateProgress(false);
    }
  }, [timeSpent]);

  // Fonction pour changer de leçon
  const changeLesson = (lessonId: string) => {
    // Sauvegarder la progression avant de changer de leçon
    if (currentLesson) {
      updateProgress(false);
    }
    
    // Trouver la nouvelle leçon
    for (const chapter of chapters) {
      const lesson = chapter.lessons.find(l => l.id === lessonId);
      if (lesson) {
        setCurrentLesson(lesson);
        setTimeSpent(0);
        setIsPlaying(true);
        setActiveTab('content');
        break;
      }
    }
  };

  // Fonction pour naviguer vers la leçon suivante
  const goToNextLesson = () => {
    if (!currentLesson) return;
    
    let foundCurrent = false;
    let nextLesson = null;
    
    // Parcourir les chapitres et les leçons pour trouver la leçon suivante
    for (const chapter of chapters) {
      for (let i = 0; i < chapter.lessons.length; i++) {
        if (foundCurrent && !nextLesson) {
          nextLesson = chapter.lessons[i];
          break;
        }
        
        if (chapter.lessons[i].id === currentLesson.id) {
          foundCurrent = true;
          if (i < chapter.lessons.length - 1) {
            nextLesson = chapter.lessons[i + 1];
            break;
          }
        }
      }
      
      if (nextLesson) break;
    }
    
    if (nextLesson) {
      changeLesson(nextLesson.id);
    } else {
      // Si c'est la dernière leçon, marquer comme complétée
      updateProgress(true);
      toast({
        title: 'Félicitations !',
        description: 'Vous avez terminé toutes les leçons de cette formation.',
      });
    }
  };

  // Fonction pour naviguer vers la leçon précédente
  const goToPreviousLesson = () => {
    if (!currentLesson) return;
    
    let previousLesson = null;
    
    // Parcourir les chapitres et les leçons pour trouver la leçon précédente
    for (const chapter of chapters) {
      for (let i = 0; i < chapter.lessons.length; i++) {
        if (chapter.lessons[i].id === currentLesson.id && i > 0) {
          previousLesson = chapter.lessons[i - 1];
          break;
        } else if (chapter.lessons[i].id === currentLesson.id) {
          // Chercher dans le chapitre précédent
          const chapterIndex = chapters.findIndex(c => c.id === chapter.id);
          if (chapterIndex > 0) {
            const prevChapter = chapters[chapterIndex - 1];
            if (prevChapter.lessons.length > 0) {
              previousLesson = prevChapter.lessons[prevChapter.lessons.length - 1];
            }
          }
          break;
        }
      }
      
      if (previousLesson) break;
    }
    
    if (previousLesson) {
      changeLesson(previousLesson.id);
    }
  };

  // Fonction pour mettre à jour la progression
  const updateProgress = async (completed = false) => {
    if (!currentLesson || !session?.user?.id || isPreview) return;
    
    try {
      // Vérifier si une entrée de progression existe déjà
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('lesson_id', currentLesson.id)
        .eq('formation_id', formationId)
        .single();
      
      if (existingProgress) {
        // Mettre à jour la progression existante
        await supabase
          .from('user_progress')
          .update({
            is_completed: completed || existingProgress.is_completed,
            time_spent: (existingProgress.time_spent || 0) + timeSpent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        // Créer une nouvelle entrée de progression
        await supabase
          .from('user_progress')
          .insert({
            user_id: session.user.id,
            formation_id: formationId,
            lesson_id: currentLesson.id,
            is_completed: completed,
            time_spent: timeSpent,
          });
      }
      
      // Mettre à jour l'état local
      setUserProgress(prev => {
        const newProgress = [...prev];
        const index = newProgress.findIndex(p => p.lesson_id === currentLesson.id);
        
        if (index >= 0) {
          newProgress[index] = {
            ...newProgress[index],
            is_completed: completed || newProgress[index].is_completed,
            time_spent: (newProgress[index].time_spent || 0) + timeSpent,
          };
        } else {
          newProgress.push({
            lesson_id: currentLesson.id,
            is_completed: completed,
            time_spent: timeSpent,
          });
        }
        
        return newProgress;
      });
      
      // Réinitialiser le compteur de temps si la leçon est marquée comme complétée
      if (completed) {
        setTimeSpent(0);
        
        // Enregistrer l'action "complete" pour les statistiques
        try {
          await fetch('/api/lesson-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lessonId: currentLesson.id,
              action: 'complete',
            }),
          });
        } catch (error) {
          console.error('Erreur lors du suivi de la complétion:', error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
    }
  };

  // Fonction pour marquer la leçon comme complétée
  const markAsCompleted = () => {
    updateProgress(true);
    toast({
      title: 'Leçon complétée',
      description: 'Votre progression a été enregistrée.',
    });
  };

  // Fonction pour calculer le pourcentage de progression
  const calculateProgress = () => {
    if (chapters.length === 0) return 0;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    chapters.forEach(chapter => {
      totalLessons += chapter.lessons.length;
      chapter.lessons.forEach(lesson => {
        const progress = userProgress.find(p => p.lesson_id === lesson.id);
        if (progress && progress.is_completed) {
          completedLessons++;
        }
      });
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Fonction pour formater le temps
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Si en cours de chargement
  if (loading || (status === 'loading' && !isPreview)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Chargement de la formation...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié et ce n'est pas un aperçu
  if (status === 'unauthenticated' && !isPreview) {
    return null; // La redirection est gérée dans le useEffect
  }

  // Si aucune formation ou leçon n'est trouvée
  if (!formation || !currentLesson) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Formation ou leçon introuvable.</p>
      </div>
    );
  }

  // Vérifier si la leçon actuelle est complétée
  const isCurrentLessonCompleted = userProgress.some(
    p => p.lesson_id === currentLesson.id && p.is_completed
  );

  return (
    <div className="min-h-screen bg-background">
      {isPreview && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-2 text-center">
          <p className="text-yellow-800 dark:text-yellow-200">
            Mode aperçu - Inscrivez-vous pour accéder à tout le contenu
          </p>
        </div>
      )}
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar avec la liste des chapitres et leçons */}
          <div className="lg:w-1/4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>{formation.title}</CardTitle>
                <CardDescription>
                  Progression: {calculateProgress()}%
                </CardDescription>
                <Progress value={calculateProgress()} className="h-2" />
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.id} className="mb-4">
                    <h3 className="font-medium text-lg mb-2">
                      {chapterIndex + 1}. {chapter.title}
                    </h3>
                    <ul className="space-y-1 pl-4">
                      {chapter.lessons.map((lesson, lessonIndex) => {
                        const isCompleted = userProgress.some(
                          p => p.lesson_id === lesson.id && p.is_completed
                        );
                        const isCurrent = currentLesson.id === lesson.id;
                        
                        return (
                          <li key={lesson.id}>
                            <button
                              onClick={() => changeLesson(lesson.id)}
                              className={`flex items-center w-full text-left py-1 px-2 rounded ${
                                isCurrent
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <span className="w-6 h-6 flex items-center justify-center mr-2">
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {chapterIndex + 1}.{lessonIndex + 1}
                                  </span>
                                )}
                              </span>
                              <span className="flex-1 truncate">{lesson.title}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {lesson.duration} min
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <div className="lg:w-3/4">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousLesson}
                  disabled={
                    chapters[0]?.lessons[0]?.id === currentLesson.id
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextLesson}
                  disabled={
                    chapters[chapters.length - 1]?.lessons[
                      chapters[chapters.length - 1]?.lessons.length - 1
                    ]?.id === currentLesson.id
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {currentLesson.duration} min
              </div>
              <div className="flex items-center text-sm">
                {isCurrentLessonCompleted ? (
                  <span className="flex items-center text-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complété
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    En cours
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Temps passé: {formatTime(timeSpent)}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Reprendre'}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTimeSpent(0)}
                  title="Réinitialiser le temps"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="content" className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Contenu
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Commentaires
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Statistiques
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose dark:prose-invert max-w-none">
                      {/* Contenu de la leçon */}
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={goToPreviousLesson}
                    disabled={
                      chapters[0]?.lessons[0]?.id === currentLesson.id
                    }
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Leçon précédente
                  </Button>
                  
                  <div className="flex gap-2">
                    {!isCurrentLessonCompleted && (
                      <Button onClick={markAsCompleted}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer comme terminé
                      </Button>
                    )}
                    
                    <Button
                      variant={isCurrentLessonCompleted ? 'default' : 'outline'}
                      onClick={goToNextLesson}
                      disabled={
                        chapters[chapters.length - 1]?.lessons[
                          chapters[chapters.length - 1]?.lessons.length - 1
                        ]?.id === currentLesson.id
                      }
                    >
                      Leçon suivante
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments">
                <CommentsSection lessonId={currentLesson.id} />
              </TabsContent>

              <TabsContent value="stats">
                <LessonStatistics 
                  lessonId={currentLesson.id} 
                  isAdmin={session?.user?.role === 'admin'} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage; 