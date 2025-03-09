'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import {
  Loader2,
  Book,
  TrendingUp,
  Award,
  UserRound,
  BarChart,
  Clock,
  PlusCircle,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

// Types pour le tableau de bord
type Formation = Database['public']['Tables']['formations']['Row'];
type UserProfile = Database['public']['Tables']['profiles']['Row'];

// Type étendu pour les formations de l'utilisateur avec progression
interface UserFormation extends Formation {
  progress: number;
  lastAccessed?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userFormations, setUserFormations] = useState<UserFormation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalFormations: 0,
    inProgressFormations: 0,
    completedFormations: 0,
    certificatesEarned: 0,
    averageProgress: 0,
  });
  
  const supabase = createClient();
  
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Vérifier l'authentification
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
        }
        
        if (!session || !session.user) {
          window.location.href = '/auth/login';
          return;
        }
        
        setUser(session.user);
        const userId = session.user.id;
        
        // 2. Récupérer le profil utilisateur
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Erreur lors de la récupération du profil:', profileError);
          // Ne pas bloquer l'expérience à cause d'une erreur de profil
        }
        
        setUserProfile(profileData || null);
        
        // 3. Récupérer les formations de l'utilisateur et leurs progrès en une seule requête
        const { data: formationsData, error: formationsError } = await supabase
          .from('user_formations')
          .select(`
            formation_id,
            purchased_at,
            formations (*)
          `)
          .eq('user_id', userId);
        
        if (formationsError) {
          console.error('Erreur lors de la récupération des formations:', formationsError);
        }
        
        // 4. Récupérer les certificats de l'utilisateur
        const { data: certificatesData, error: certificatesError } = await supabase
          .from('certificates')
          .select('formation_id')
          .eq('user_id', userId);
        
        if (certificatesError) {
          console.error('Erreur lors de la récupération des certificats:', certificatesError);
        }
        
        const certificateFormationIds = certificatesData?.map(cert => cert.formation_id) || [];
        
        // 5. Récupérer la progression de l'utilisateur pour toutes les formations
        const { data: userProgressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId);
        
        if (progressError) {
          console.error('Erreur lors de la récupération de la progression:', progressError);
        }
        
        // Transformer les données pour obtenir les formations avec leur progression
        const formattedFormations: UserFormation[] = [];
        let totalProgress = 0;
        
        if (formationsData && formationsData.length > 0) {
          for (const item of formationsData) {
            if (item.formations) {
              // Filtrer les progrès pour cette formation
              const formation = item.formations as unknown as Formation;
              let progress = 0;
              let lastAccessed: string | undefined;
              
              // Une formation est considérée comme complétée si elle a un certificat
              const isCompleted = certificateFormationIds.includes(formation.id);
              
              if (isCompleted) {
                progress = 100;
              } else {
                // Calculer la progression réelle
                // Note: Cette logique pourrait être optimisée en déplaçant ce calcul côté serveur
                const { data: chaptersData } = await supabase
                  .from('chapters')
                  .select(`
                    id,
                    lessons (id)
                  `)
                  .eq('formation_id', formation.id);
                
                let totalLessons = 0;
                let completedLessons = 0;
                let latestAccessTimestamp = 0;
                
                if (chaptersData && chaptersData.length > 0) {
                  for (const chapter of chaptersData) {
                    if (chapter.lessons && Array.isArray(chapter.lessons)) {
                      totalLessons += chapter.lessons.length;
                      
                      for (const lesson of chapter.lessons) {
                        const progressEntry = userProgressData?.find(p => p.lesson_id === lesson.id);
                        
                        if (progressEntry) {
                          if (progressEntry.completed) {
                            completedLessons++;
                          }
                          
                          const accessTimestamp = new Date(progressEntry.last_accessed).getTime();
                          if (accessTimestamp > latestAccessTimestamp) {
                            latestAccessTimestamp = accessTimestamp;
                            lastAccessed = progressEntry.last_accessed;
                          }
                        }
                      }
                    }
                  }
                }
                
                progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
              }
              
              formattedFormations.push({
                ...formation,
                progress,
                lastAccessed
              });
              
              totalProgress += progress;
            }
          }
        }
        
        // Trier les formations par progression (décroissante) puis par date d'achat (plus récente)
        formattedFormations.sort((a, b) => {
          // D'abord les formations en cours (ni 0%, ni 100%)
          const aInProgress = a.progress > 0 && a.progress < 100;
          const bInProgress = b.progress > 0 && b.progress < 100;
          
          if (aInProgress && !bInProgress) return -1;
          if (!aInProgress && bInProgress) return 1;
          
          // Ensuite par progression (décroissante)
          if (a.progress !== b.progress) return b.progress - a.progress;
          
          // Enfin par date de mise à jour (plus récente)
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        
        setUserFormations(formattedFormations);
        
        // Calculer les statistiques
        const averageProgress = formattedFormations.length > 0 
          ? Math.round(totalProgress / formattedFormations.length) 
          : 0;
        
        const inProgressCount = formattedFormations.filter(f => f.progress > 0 && f.progress < 100).length;
        const completedCount = formattedFormations.filter(f => f.progress === 100).length;
        
        setStats({
          totalFormations: formattedFormations.length,
          inProgressFormations: inProgressCount,
          completedFormations: completedCount,
          certificatesEarned: certificateFormationIds.length,
          averageProgress,
        });
        
      } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord:', error);
        setError('Une erreur est survenue lors du chargement de vos données. Veuillez réessayer.');
        // Afficher un toast d'erreur
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger vos données. Veuillez rafraîchir la page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);
  
  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de Bord</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <h2 className="text-2xl font-semibold mb-4">Vos formations</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-6" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-2.5 w-full mb-6" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Afficher l'erreur si elle existe
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erreur</h2>
          <p className="mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }
  
  // Si l'utilisateur n'a pas de formations mais un profil valide, proposer d'explorer le catalogue
  const showEmptyState = userFormations.length === 0;
  
  // Dans le cas où un profil existe mais aucune formation, on peut personnaliser le message
  const greeting = userProfile?.full_name 
    ? `Bonjour, ${userProfile.full_name.split(' ')[0]} !` 
    : "Bienvenue sur votre tableau de bord !";
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{greeting}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {showEmptyState 
              ? "Commencez votre parcours d'apprentissage dès maintenant." 
              : `Vous avez ${stats.inProgressFormations} formation${stats.inProgressFormations !== 1 ? 's' : ''} en cours.`}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/profil">
              <UserRound className="mr-2 h-4 w-4" />
              Profil
            </Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/formations">
              <PlusCircle className="mr-2 h-4 w-4" />
              Explorer les formations
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Formations</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFormations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedFormations} terminée{stats.completedFormations !== 1 ? 's' : ''}, {stats.inProgressFormations} en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progression moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
            <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${stats.averageProgress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temps d'apprentissage</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showEmptyState ? "0h" : `${Math.round(stats.totalFormations * 3.5)}h`}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimé selon votre progression
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certificats</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificatesEarned}</div>
            <p className="text-xs text-muted-foreground">
              {stats.certificatesEarned > 0 
                ? `Sur ${stats.totalFormations} formation${stats.totalFormations !== 1 ? 's' : ''}` 
                : "Terminez une formation pour obtenir un certificat"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* État zéro: Aucune formation */}
      {showEmptyState ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Commencez votre apprentissage</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            Vous n'avez pas encore de formations. Explorez notre catalogue et commencez votre parcours d'apprentissage dès maintenant.
          </p>
          <div className="grid gap-4 md:grid-cols-2 max-w-md mx-auto">
            <Button asChild variant="default" size="lg">
              <Link href="/formations">
                Découvrir les formations
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/statistiques">
                Voir vos statistiques
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Section des formations récentes/en cours */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Vos formations</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/formations" className="flex items-center">
                  Voir toutes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userFormations.slice(0, 3).map((formation) => (
                <Card key={formation.id} className="overflow-hidden flex flex-col h-full">
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    {formation.image_url ? (
                      <img 
                        src={formation.image_url} 
                        alt={formation.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Book className="h-16 w-16 text-white" />
                    )}
                  </div>
                  <CardContent className="flex-1 flex flex-col pt-6">
                    <h3 className="text-xl font-semibold mb-2 line-clamp-1">{formation.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {formation.description}
                    </p>
                    
                    <div className="mt-auto space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progression</span>
                          <span className="font-medium">{formation.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              formation.progress === 100
                                ? 'bg-green-600 dark:bg-green-500'
                                : 'bg-blue-600 dark:bg-blue-500'
                            }`}
                            style={{ width: `${formation.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button asChild className="flex-1">
                          <Link href={`/formations/${formation.id}`}>
                            {formation.progress === 0 ? 'Commencer' : 
                              formation.progress === 100 ? 'Revoir' : 'Continuer'}
                          </Link>
                        </Button>
                        
                        {formation.progress === 100 && (
                          <Button asChild variant="outline">
                            <Link href={`/dashboard/certificats/${formation.id}`}>
                              <Award className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Carte des statistiques et recommandations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques détaillées</CardTitle>
                <CardDescription>Suivez votre progression d'apprentissage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4 flex-shrink-0">
                    <BarChart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Progression globale</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${stats.averageProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats.averageProgress}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-20 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Formations terminées:</span>
                    <span className="font-medium">{stats.completedFormations} / {stats.totalFormations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Formations en cours:</span>
                    <span className="font-medium">{stats.inProgressFormations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Certificats obtenus:</span>
                    <span className="font-medium">{stats.certificatesEarned}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/dashboard/statistiques" className="flex items-center justify-center">
                    Statistiques détaillées
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
                <CardDescription>Basées sur votre profil d'apprentissage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.inProgressFormations > 0 ? (
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium mb-2">Continuez votre progression</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Vous avez {stats.inProgressFormations} formation{stats.inProgressFormations !== 1 ? 's' : ''} en cours. Continuez pour obtenir votre certificat !
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/formations?filter=in-progress">
                        Reprendre
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <h3 className="font-medium mb-2">Découvrez de nouvelles formations</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Explorez notre catalogue pour trouver votre prochaine formation.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/formations">
                        Explorer
                      </Link>
                    </Button>
                  </div>
                )}
                
                {stats.completedFormations > 0 && (
                  <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <h3 className="font-medium mb-2">Vos réussites</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Vous avez terminé {stats.completedFormations} formation{stats.completedFormations !== 1 ? 's' : ''}. Consultez vos certificats !
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/certificats">
                        Voir les certificats
                      </Link>
                    </Button>
                  </div>
                )}
                
                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <h3 className="font-medium mb-2">Personnalisez votre profil</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Complétez votre profil pour une expérience personnalisée.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/profil">
                      Compléter
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 