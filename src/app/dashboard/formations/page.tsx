'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Type pour les formations de l'utilisateur
interface UserFormation {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  level: string;
  duration: number;
  completed: boolean;
  progress: number;
  last_accessed: string | null;
}

export default function UserFormationsPage() {
  const [formations, setFormations] = useState<UserFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchFormations() {
      setLoading(true);
      
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          router.push('/auth/login');
          return;
        }
        
        // Récupérer les formations de l'utilisateur
        const { data: userFormations, error: formationsError } = await supabase
          .from('user_formations')
          .select(`
            id,
            formation_id,
            purchased_at,
            formations (
              id,
              title,
              description,
              price,
              image_url,
              level,
              duration
            )
          `)
          .eq('user_id', authUser.id);
        
        if (formationsError) {
          console.error('Erreur lors de la récupération des formations:', formationsError);
          setError('Impossible de récupérer vos formations. Veuillez réessayer plus tard.');
          setLoading(false);
          return;
        }
        
        if (!userFormations || userFormations.length === 0) {
          setFormations([]);
          setLoading(false);
          return;
        }
        
        // Récupérer la progression pour chaque formation
        const formationsWithProgress = await Promise.all(
          userFormations.map(async (userFormation: any) => {
            const { data: progressData, error: progressError } = await supabase
              .from('user_progress')
              .select('*')
              .eq('user_id', authUser.id)
              .eq('formation_id', userFormation.formation_id);
            
            if (progressError) {
              console.error('Erreur lors de la récupération de la progression:', progressError);
            }
            
            // Récupérer le nombre total de leçons pour cette formation
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('lessons')
              .select('id')
              .eq('formation_id', userFormation.formation_id);
            
            if (lessonsError) {
              console.error('Erreur lors de la récupération des leçons:', lessonsError);
            }
            
            const totalLessons = lessonsData?.length || 0;
            const completedLessons = progressData?.filter(p => p.completed)?.length || 0;
            const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            const completed = totalLessons > 0 && completedLessons === totalLessons;
            
            // Récupérer la dernière leçon consultée
            const { data: lastAccessedData, error: lastAccessedError } = await supabase
              .from('user_progress')
              .select('last_accessed')
              .eq('user_id', authUser.id)
              .eq('formation_id', userFormation.formation_id)
              .order('last_accessed', { ascending: false })
              .limit(1);
            
            const lastAccessed = lastAccessedData && lastAccessedData.length > 0 
              ? lastAccessedData[0].last_accessed 
              : null;
            
            return {
              id: userFormation.formations.id,
              title: userFormation.formations.title,
              description: userFormation.formations.description,
              price: userFormation.formations.price,
              image_url: userFormation.formations.image_url,
              level: userFormation.formations.level || 'débutant',
              duration: userFormation.formations.duration || 0,
              completed,
              progress,
              last_accessed: lastAccessed
            };
          })
        );
        
        // Trier les formations : en cours d'abord, puis terminées
        const sortedFormations = formationsWithProgress.sort((a, b) => {
          if (a.completed === b.completed) {
            // Si même statut, trier par progression décroissante
            return b.progress - a.progress;
          }
          // Formations non terminées d'abord
          return a.completed ? 1 : -1;
        });
        
        setFormations(sortedFormations);
      } catch (error) {
        console.error('Erreur lors du chargement des formations:', error);
        setError('Une erreur est survenue lors du chargement de vos formations.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchFormations();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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

        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erreur</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {formations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="text-center py-10">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune formation</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Vous n'avez pas encore commencé de formation.
              </p>
              <div className="mt-6">
                <Link
                  href="/formations"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Découvrir nos formations
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((formation) => (
              <div
                key={formation.id}
                className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  {formation.image_url ? (
                    <img
                      src={formation.image_url}
                      alt={formation.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
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
                  )}
                </div>
                
                <div className="p-6 flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {formation.level}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.floor(formation.duration / 60)}h{formation.duration % 60 > 0 ? ` ${formation.duration % 60}min` : ''}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {formation.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">
                    {formation.description}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progression
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formation.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          formation.completed
                            ? 'bg-green-600 dark:bg-green-500'
                            : 'bg-blue-600 dark:bg-blue-500'
                        }`}
                        style={{ width: `${formation.progress}%` }}
                      ></div>
                    </div>
                    
                    {formation.last_accessed && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Dernière activité: {new Date(formation.last_accessed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <Link
                    href={`/formations/${formation.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {formation.completed ? 'Revoir la formation' : 'Continuer la formation'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 