'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Formation = Database['public']['Tables']['formations']['Row'];

// Type pour les formations de l'utilisateur avec des propriétés supplémentaires
interface UserFormation extends Formation {
  completed: boolean;
  progress: number;
  purchasedAt: string;
}

export default function UserFormationsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userFormations, setUserFormations] = useState<UserFormation[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        fetchUserFormations(user.id);
      } else {
        setLoading(false);
      }
    }

    getUser();
  }, [supabase]);

  const fetchUserFormations = async (userId: string) => {
    setLoading(true);
    try {
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
        setLoading(false);
        return;
      }

      // Récupérer la progression de l'utilisateur pour chaque formation
      const formationsWithProgress: UserFormation[] = [];
      
      if (userFormationsData && userFormationsData.length > 0) {
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
              completed,
              purchasedAt: item.purchased_at
            });
          }
        }
      }
      
      setUserFormations(formationsWithProgress);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFormations = userFormations.filter(formation => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'in-progress') return !formation.completed;
    if (activeFilter === 'completed') return formation.completed;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mes formations
        </h1>
        <Link
          href="/formations"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Découvrir plus de formations
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeFilter === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Toutes ({userFormations.length})
          </button>
          <button
            onClick={() => setActiveFilter('in-progress')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeFilter === 'in-progress'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            En cours ({userFormations.filter(f => !f.completed).length})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeFilter === 'completed'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Terminées ({userFormations.filter(f => f.completed).length})
          </button>
        </div>
      </div>

      {/* Liste des formations */}
      {filteredFormations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            {activeFilter === 'all' 
              ? "Vous n'avez pas encore de formations" 
              : activeFilter === 'in-progress' 
                ? "Vous n'avez pas de formations en cours" 
                : "Vous n'avez pas encore terminé de formations"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activeFilter === 'all' 
              ? "Découvrez notre catalogue de formations pour commencer votre apprentissage." 
              : activeFilter === 'in-progress' 
                ? "Toutes vos formations sont terminées ou vous n'avez pas encore commencé de formation." 
                : "Continuez à progresser dans vos formations pour obtenir des certificats."}
          </p>
          {activeFilter === 'all' && (
            <div className="mt-6">
              <Link
                href="/formations"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Découvrir nos formations
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFormations.map((formation) => (
            <div
              key={formation.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg
                  className="h-20 w-20 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {formation.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                  {formation.description}
                </p>
                
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>Progression</span>
                    <span className="font-medium">{formation.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                    <div
                      className={`h-2.5 rounded-full ${
                        formation.completed
                          ? 'bg-green-600 dark:bg-green-500'
                          : 'bg-blue-600 dark:bg-blue-500'
                      }`}
                      style={{ width: `${formation.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Achetée le {formatDate(formation.purchasedAt)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formation.completed
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {formation.completed ? 'Terminée' : 'En cours'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/formations/${formation.id}`}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {formation.completed ? 'Revoir' : 'Continuer'}
                    </Link>
                    
                    {formation.completed && (
                      <Link
                        href={`/dashboard/certificats/${formation.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg
                          className="mr-1.5 h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Certificat
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 