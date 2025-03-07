'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Loader2, BookOpen, Award, Clock, User, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

/**
 * Type pour les formations depuis la base de données
 */
type Formation = Database['public']['Tables']['formations']['Row'];

/**
 * Interface pour les formations de l'utilisateur avec des propriétés supplémentaires
 * Étend le type Formation avec des informations de progression
 */
interface UserFormation extends Formation {
  completed: boolean;  // Indique si la formation est terminée
  progress: number;    // Pourcentage de progression (0-100)
  lastAccessed?: string; // Date du dernier accès
}

/**
 * Interface pour les informations de l'utilisateur
 */
interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

/**
 * Page principale du tableau de bord
 * Affiche les formations de l'utilisateur avec leur progression
 */
export default function DashboardPage() {
  const [userFormations, setUserFormations] = useState<UserFormation[]>([]);
  const [formationsLoading, setFormationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalFormations: 0,
    completedFormations: 0,
    totalProgress: 0,
    certificatesEarned: 0
  });
  
  const supabase = createClient();

  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!data.session) {
          console.log("Utilisateur non authentifié, redirection vers la page de connexion");
          window.location.href = '/auth/login';
          return;
        }
        
        setIsAuthenticated(true);
        setUserId(data.session.user.id);
        
        // Récupérer le profil de l'utilisateur
        await fetchUserProfile(data.session.user.id);
        
        // Charger les formations de l'utilisateur
        await fetchUserFormations(data.session.user.id);
        
        setIsCheckingAuth(false);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setError("Impossible de vérifier votre authentification. Veuillez vous reconnecter.");
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  /**
   * Récupère le profil de l'utilisateur
   * @param userId - L'identifiant de l'utilisateur
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  /**
   * Récupère les formations de l'utilisateur et calcule leur progression
   * @param userId - L'identifiant de l'utilisateur
   */
  const fetchUserFormations = async (userId: string) => {
    setFormationsLoading(true);
    try {
      console.log("Récupération des formations pour l'utilisateur:", userId);
      
      // Récupérer les formations achetées par l'utilisateur
      const { data: userFormationsData, error: userFormationsError } = await supabase
        .from('user_formations')
        .select(`
          formation_id,
          purchased_at,
          formations (*)
        `)
        .eq('user_id', userId);

      if (userFormationsError) {
        console.error('Erreur lors de la récupération des formations:', userFormationsError);
        setFormationsLoading(false);
        return;
      }

      console.log("Formations récupérées:", userFormationsData ? userFormationsData.length : 0);

      // Si aucune formation n'est trouvée, terminer le chargement
      if (!userFormationsData || userFormationsData.length === 0) {
        setUserFormations([]);
        setFormationsLoading(false);
        return;
      }

      // Récupérer la progression de l'utilisateur pour chaque formation
      const formationsWithProgress: UserFormation[] = [];
      let completedCount = 0;
      let totalProgressPercentage = 0;
      
      // Récupérer les certificats de l'utilisateur
      const { data: certificatesData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId);
      
      const certificatesCount = certificatesData ? certificatesData.length : 0;
      
      for (const item of userFormationsData) {
        if (item.formations) {
          // Conversion explicite du type any à Formation
          const formation = item.formations as unknown as Formation;
          
          // Récupérer les leçons de cette formation
          const { data: chaptersData } = await supabase
            .from('chapters')
            .select(`
              id,
              lessons (id)
            `)
            .eq('formation_id', formation.id);
          
          // Calculer le nombre total de leçons et les leçons complétées
          let totalLessons = 0;
          let completedLessons = 0;
          let lastAccessedDate = null;
          
          if (chaptersData && chaptersData.length > 0) {
            for (const chapter of chaptersData) {
              if (chapter.lessons && Array.isArray(chapter.lessons)) {
                totalLessons += chapter.lessons.length;
                
                // Récupérer les leçons complétées et la dernière date d'accès
                for (const lesson of chapter.lessons) {
                  const { data: progressData } = await supabase
                    .from('user_progress')
                    .select('completed, last_accessed')
                    .eq('user_id', userId)
                    .eq('lesson_id', lesson.id)
                    .single();
                  
                  if (progressData) {
                    if (progressData.completed) {
                      completedLessons++;
                    }
                    
                    if (progressData.last_accessed) {
                      if (!lastAccessedDate || new Date(progressData.last_accessed) > new Date(lastAccessedDate)) {
                        lastAccessedDate = progressData.last_accessed;
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Calculer le pourcentage de progression
          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          const completed = progress === 100;
          
          if (completed) {
            completedCount++;
          }
          
          totalProgressPercentage += progress;
          
          // Ajouter la formation avec sa progression à la liste
          formationsWithProgress.push({
            ...formation,
            progress,
            completed,
            lastAccessed: lastAccessedDate
          });
        }
      }
      
      // Trier les formations par date de dernier accès (les plus récentes en premier)
      formationsWithProgress.sort((a, b) => {
        if (!a.lastAccessed) return 1;
        if (!b.lastAccessed) return -1;
        return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
      });
      
      // Mettre à jour les statistiques
      setStats({
        totalFormations: formationsWithProgress.length,
        completedFormations: completedCount,
        totalProgress: formationsWithProgress.length > 0 
          ? Math.round(totalProgressPercentage / formationsWithProgress.length) 
          : 0,
        certificatesEarned: certificatesCount
      });
      
      // Mettre à jour l'état avec les formations et leur progression
      setUserFormations(formationsWithProgress);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
    } finally {
      setFormationsLoading(false);
    }
  };

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Vérification de votre authentification...</p>
      </div>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erreur</h2>
          <p className="mb-6">{error}</p>
          <Button asChild>
            <Link href="/auth/login">Se reconnecter</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Afficher un message si l'utilisateur n'a pas de formations
  if (userFormations.length === 0 && !formationsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Votre tableau de bord</h1>
        
        {/* Section de profil utilisateur */}
        {userProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-4">
                {userProfile.avatar_url ? (
                  <Image 
                    src={userProfile.avatar_url} 
                    alt={userProfile.full_name || 'Avatar'} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {userProfile.full_name || 'Utilisateur'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{userProfile.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Membre depuis {new Date(userProfile.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-auto">
                <Button asChild variant="outline">
                  <Link href="/dashboard/profil" className="flex items-center">
                    Modifier mon profil
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Vos formations</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous n'avez pas encore de formations. Découvrez nos formations disponibles et commencez votre apprentissage dès aujourd'hui !
          </p>
          <Button asChild>
            <Link href="/formations">Découvrir les formations</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Afficher le tableau de bord avec les formations
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Votre tableau de bord</h1>
      
      {/* Section de profil utilisateur */}
      {userProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center">
            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-4">
              {userProfile.avatar_url ? (
                <Image 
                  src={userProfile.avatar_url} 
                  alt={userProfile.full_name || 'Avatar'} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {userProfile.full_name || 'Utilisateur'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{userProfile.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Membre depuis {new Date(userProfile.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="ml-auto flex space-x-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/profil" className="flex items-center">
                  Modifier mon profil
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/statistiques" className="flex items-center">
                  Voir mes statistiques
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Section de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Formations</p>
              <p className="text-2xl font-semibold">{stats.totalFormations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mr-4">
              <Award className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Formations terminées</p>
              <p className="text-2xl font-semibold">{stats.completedFormations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-4">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Progression globale</p>
              <p className="text-2xl font-semibold">{stats.totalProgress}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 mr-4">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Certificats obtenus</p>
              <p className="text-2xl font-semibold">{stats.certificatesEarned}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        {/* En-tête avec le titre */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Vos formations</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/formations">Découvrir plus de formations</Link>
          </Button>
        </div>
        
        {/* Affichage des formations ou indicateur de chargement */}
        {formationsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Liste des formations avec leur progression */}
            {userFormations.map((formation) => (
              <div key={formation.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  {formation.image_url ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={formation.image_url} 
                        alt={formation.title} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <BookOpen className="h-12 w-12 text-white" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{formation.title}</h3>
                  
                  {/* Dernière activité */}
                  {formation.lastAccessed && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Dernière activité: {new Date(formation.lastAccessed).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {/* Barre de progression */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full mb-2">
                    <div 
                      className={`h-full rounded-full ${
                        formation.completed 
                          ? 'bg-green-500' 
                          : formation.progress > 0 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300 dark:bg-gray-500'
                      }`}
                      style={{ width: `${formation.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span>Progression: {formation.progress}%</span>
                    {formation.completed && <span className="text-green-500">Terminé ✓</span>}
                  </div>
                  
                  {/* Bouton pour accéder à la formation */}
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/formations/${formation.id}`}>
                      {formation.progress > 0 ? 'Continuer' : 'Commencer'}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 