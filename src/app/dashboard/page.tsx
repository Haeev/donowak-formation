'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        setIsCheckingAuth(false);
        
        // Charger les formations de l'utilisateur
        await fetchUserFormations(data.session.user.id);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setError("Impossible de vérifier votre authentification. Veuillez vous reconnecter.");
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

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
          
          if (chaptersData && chaptersData.length > 0) {
            for (const chapter of chaptersData) {
              if (chapter.lessons && Array.isArray(chapter.lessons)) {
                totalLessons += chapter.lessons.length;
                
                // Récupérer les leçons complétées
                for (const lesson of chapter.lessons) {
                  const { data: progressData } = await supabase
                    .from('user_progress')
                    .select('completed')
                    .eq('user_id', userId)
                    .eq('lesson_id', lesson.id)
                    .single();
                  
                  if (progressData && progressData.completed) {
                    completedLessons++;
                  }
                }
              }
            }
          }
          
          // Calculer le pourcentage de progression
          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          const completed = progress === 100;
          
          // Ajouter la formation avec sa progression à la liste
          formationsWithProgress.push({
            ...formation,
            progress,
            completed
          });
        }
      }
      
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
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        {/* En-tête avec le nom de l'utilisateur */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Vos formations</h2>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/profil">
                Gérer votre profil
              </Link>
            </Button>
            <div className="text-sm text-gray-500">
              {userId && <span>Connecté</span>}
            </div>
          </div>
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
              <div key={formation.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{formation.title}</h3>
                  {/* Barre de progression */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full mb-2">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
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