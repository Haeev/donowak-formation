'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userFormations, setUserFormations] = useState<UserFormation[]>([]);
  const [formationsLoading, setFormationsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fonction pour définir un timeout sur le chargement
  const setLoadingWithTimeout = (loading: boolean) => {
    if (loading) {
      setLoading(true);
      // Définir un timeout pour éviter un chargement infini
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('Timeout de chargement atteint, réinitialisation de l\'état');
        setLoading(false);
        setError('Le chargement a pris trop de temps. Veuillez rafraîchir la page ou vous reconnecter.');
      }, 8000); // 8 secondes maximum de chargement
    } else {
      setLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };

  useEffect(() => {
    async function getUser() {
      try {
        console.log("Tentative de récupération de l'utilisateur...");
        setLoadingWithTimeout(true);
        
        // Vérifier la session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log("Session:", sessionData.session ? "Trouvée" : "Non trouvée");
        
        if (sessionError) {
          throw new Error(`Erreur de session: ${sessionError.message}`);
        }
        
        if (!sessionData.session) {
          // Essayer de récupérer l'utilisateur directement
          const { data: userData, error: userError } = await supabase.auth.getUser();
          console.log("Utilisateur:", userData.user ? "Trouvé" : "Non trouvé");
          
          if (userError) {
            throw new Error(`Erreur utilisateur: ${userError.message}`);
          }
          
          if (!userData.user) {
            console.log("Aucun utilisateur trouvé, redirection vers la page de connexion");
            setLoadingWithTimeout(false);
            // Utiliser window.location pour un rechargement complet
            window.location.href = '/auth/login';
            return;
          }
          
          setUser(userData.user);
        } else {
          setUser(sessionData.session.user);
        }
        
        setLoadingWithTimeout(false);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        setLoadingWithTimeout(false);
        setError("Une erreur est survenue lors du chargement du tableau de bord. Veuillez vous reconnecter.");
        // Rediriger vers la page de connexion après 3 secondes en cas d'erreur
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 3000);
      }
    }

    getUser();
    
    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Événement d\'authentification dans le dashboard:', event);
        
        if (event === 'SIGNED_OUT') {
          console.log('Utilisateur déconnecté, redirection vers la page d\'accueil');
          window.location.href = '/';
          return;
        }
        
        if (session) {
          console.log('Session mise à jour, utilisateur:', session.user.id);
          setUser(session.user);
          fetchUserFormations(session.user.id);
        } else if (event !== 'INITIAL_SESSION') {
          // Si pas de session et ce n'est pas l'événement initial, rediriger vers la connexion
          console.log('Pas de session, redirection vers la page de connexion');
          window.location.href = '/auth/login';
        }
      }
    );
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Effet pour charger les formations une fois que l'utilisateur est défini
  useEffect(() => {
    if (user && user.id) {
      console.log("Utilisateur défini, chargement des formations pour:", user.id);
      fetchUserFormations(user.id);
    }
  }, [user]);

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
              completed
            });
          }
        }
      }
      
      setUserFormations(formationsWithProgress);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
    } finally {
      setFormationsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // Appeler l'API route pour supprimer le compte
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la suppression du compte');
      }

      // Déconnecter l'utilisateur localement
      await supabase.auth.signOut();
      
      // Effacer les cookies et le stockage local
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      localStorage.clear();
      sessionStorage.clear();

      // Rediriger vers la page d'accueil avec un rechargement complet
      window.location.href = '/?message=Votre compte a été supprimé avec succès';
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la suppression du compte');
      setDeleting(false);
      setShowConfirmation(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
    setError(null);
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <Link href="/auth/logout" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
            Déconnexion
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Bienvenue, {user?.user_metadata?.full_name || user?.email}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Informations de votre compte
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.email}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.id}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Dernière connexion</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(user?.last_sign_in_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section des formations de l'utilisateur */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Vos formations
              </h3>
              <Link
                href="/dashboard/formations"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voir toutes vos formations
              </Link>
            </div>
            <div className="border-t border-gray-200">
              {formationsLoading ? (
                <div className="px-4 py-5 sm:p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Chargement de vos formations...</p>
                </div>
              ) : userFormations.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center">
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune formation</h3>
                  <p className="mt-1 text-sm text-gray-500">
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
              ) : (
                <ul className="divide-y divide-gray-200">
                  {userFormations.slice(0, 3).map((formation) => (
                    <li key={formation.id} className="px-4 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-blue-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formation.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {formation.completed ? 'Terminée' : `Progression: ${formation.progress}%`}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div
                              className={`h-2.5 rounded-full ${
                                formation.completed
                                  ? 'bg-green-600'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${formation.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <Link
                            href={`/formations/${formation.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            {formation.completed ? 'Revoir' : 'Continuer'}
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                  {userFormations.length > 3 && (
                    <li className="px-4 py-4 text-center">
                      <Link
                        href="/dashboard/formations"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Voir toutes vos formations ({userFormations.length})
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Section de suppression de compte */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-red-600">
                Zone de danger
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Supprimer votre compte
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Une fois que vous supprimez votre compte, toutes vos données seront définitivement supprimées.
                  Cette action ne peut pas être annulée.
                </p>
              </div>
              
              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              {showConfirmation ? (
                <div className="mt-5">
                  <p className="text-sm font-medium text-red-600 mb-4">
                    Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting ? 'Suppression en cours...' : 'Oui, supprimer mon compte'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={cancelDelete}
                      disabled={deleting}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={handleDeleteAccount}
                  >
                    Supprimer mon compte
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 