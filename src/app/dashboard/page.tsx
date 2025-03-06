'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Formation = Database['public']['Tables']['formations']['Row'];

// Type pour les formations de l'utilisateur avec des propriétés supplémentaires
interface UserFormation extends Formation {
  completed: boolean;
  progress: number;
}

// Type pour les données utilisateur stockées dans localStorage
interface StoredUserData {
  id: string;
  email: string;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<StoredUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFormations, setUserFormations] = useState<UserFormation[]>([]);
  const [formationsLoading, setFormationsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Vérifier l'authentification au chargement de la page
  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log("Vérification de l'authentification via localStorage...");
        
        // Récupérer les données utilisateur depuis localStorage
        const storedUserData = localStorage.getItem('donowak_user');
        
        if (!storedUserData) {
          console.log("Aucune donnée utilisateur trouvée dans localStorage");
          setError("Vous n'êtes pas connecté. Veuillez vous connecter pour accéder à votre tableau de bord.");
          setLoading(false);
          
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
          return;
        }
        
        // Parser les données utilisateur
        const userData: StoredUserData = JSON.parse(storedUserData);
        console.log("Données utilisateur trouvées pour:", userData.email);
        
        // Vérifier si la session a expiré
        if (userData.session.expires_at < Math.floor(Date.now() / 1000)) {
          console.log("Session expirée, redirection vers la page de connexion");
          localStorage.removeItem('donowak_user');
          setError("Votre session a expiré. Veuillez vous reconnecter.");
          setLoading(false);
          
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
          return;
        }
        
        // Définir l'utilisateur
        setUser(userData);
        
        // Configurer le client Supabase avec le token d'accès
        supabase.auth.setSession({
          access_token: userData.session.access_token,
          refresh_token: userData.session.refresh_token
        });
        
        // Charger les formations de l'utilisateur
        fetchUserFormations(userData.id);
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setError("Une erreur est survenue lors du chargement du tableau de bord. Veuillez vous reconnecter.");
        setLoading(false);
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
    };
    
    // Définir un timeout pour éviter un chargement infini
    loadingTimeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log("Timeout de chargement atteint");
        setLoading(false);
        setError("Le chargement a pris trop de temps. Veuillez rafraîchir la page ou vous reconnecter.");
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
    }, 5000); // 5 secondes maximum
    
    checkAuth();
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

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
          
          // Calculer le nombre total de leçons
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
          
          formationsWithProgress.push({
            ...formation,
            progress,
            completed
          });
        }
      }
      
      setUserFormations(formationsWithProgress);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
    } finally {
      setFormationsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Votre tableau de bord</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Vos formations</h2>
          <div className="text-sm text-gray-500">
            Connecté en tant que: {user?.email}
          </div>
        </div>
        
        {formationsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFormations.map((formation) => (
              <div key={formation.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{formation.title}</h3>
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