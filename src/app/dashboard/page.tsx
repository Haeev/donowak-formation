'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserStats from '@/components/dashboard/UserStats';
import UserFormations from '@/components/dashboard/UserFormations';

// Types pour les données utilisateur
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

// Type pour les formations de l'utilisateur
interface UserFormation {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  completed: boolean;
  progress: number;
}

// Type pour les certificats
interface Certificate {
  id: string;
  user_id: string;
  formation_id: string;
  formation_title: string;
  issued_at: string;
  certificate_url: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [formations, setFormations] = useState<UserFormation[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          router.push('/auth/login');
          return;
        }
        
        // Récupérer les informations de l'utilisateur depuis la table users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (userError || !userData) {
          console.error('Erreur lors de la récupération des informations utilisateur:', userError);
          setError('Impossible de récupérer vos informations. Veuillez réessayer plus tard.');
          setLoading(false);
          return;
        }
        
        setUser(userData);
        
        // Récupérer les formations de l'utilisateur
        const { data: userFormations, error: formationsError } = await supabase
          .from('user_formations')
          .select(`
            id,
            formation_id,
            formations (
              id,
              title,
              description,
              price,
              image_url,
              published,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', authUser.id);
        
        if (formationsError) {
          console.error('Erreur lors de la récupération des formations:', formationsError);
        } else if (userFormations) {
          // Récupérer la progression pour chaque formation
          const formationsWithProgress = await Promise.all(
            userFormations.map(async (userFormation: any) => {
              const { data: progressData, error: progressError } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', authUser.id)
                .eq('formation_id', userFormation.formation_id);
              
              const totalLessons = 10; // À remplacer par le nombre réel de leçons
              const completedLessons = progressData?.filter(p => p.completed)?.length || 0;
              const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
              const completed = progress === 100;
              
              return {
                id: userFormation.formations.id,
                title: userFormation.formations.title,
                description: userFormation.formations.description,
                price: userFormation.formations.price,
                image_url: userFormation.formations.image_url,
                published: userFormation.formations.published,
                created_at: userFormation.formations.created_at,
                updated_at: userFormation.formations.updated_at,
                completed,
                progress
              };
            })
          );
          
          setFormations(formationsWithProgress);
        }
        
        // Récupérer les certificats de l'utilisateur
        const { data: userCertificates, error: certificatesError } = await supabase
          .from('certificates')
          .select(`
            id,
            user_id,
            formation_id,
            issued_at,
            certificate_url,
            formations (
              title
            )
          `)
          .eq('user_id', authUser.id);
        
        if (certificatesError) {
          console.error('Erreur lors de la récupération des certificats:', certificatesError);
        } else if (userCertificates) {
          setCertificates(
            userCertificates.map((cert: any) => ({
              id: cert.id,
              user_id: cert.user_id,
              formation_id: cert.formation_id,
              formation_title: cert.formations.title,
              issued_at: cert.issued_at,
              certificate_url: cert.certificate_url
            }))
          );
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Une erreur est survenue lors du chargement de vos données.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, router]);

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

      // Rediriger vers la page d'accueil
      router.push('/?message=Votre compte a été supprimé avec succès');
      router.refresh();
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
      <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <h2 className="mt-6 text-center text-xl font-medium text-gray-900 dark:text-white">
            Chargement de votre tableau de bord...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bienvenue, {user?.first_name || user?.email?.split('@')[0]}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Voici un aperçu de votre progression et de vos formations en cours.
          </p>
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

        {/* Statistiques utilisateur */}
        {user && <UserStats user={user} formations={formations} certificates={certificates} />}

        {/* Formations de l'utilisateur */}
        <UserFormations formations={formations} />

        {/* Certificats */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vos certificats</h2>
          
          {certificates.length === 0 ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun certificat</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Terminez une formation pour obtenir votre premier certificat.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate) => (
                  <li key={certificate.id} className="col-span-1 bg-white dark:bg-gray-700 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-600">
                    <div className="w-full flex items-center justify-between p-6 space-x-6">
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{certificate.formation_title}</h3>
                          <span className="flex-shrink-0 inline-block px-2 py-0.5 text-green-800 text-xs font-medium bg-green-100 rounded-full">
                            Certifié
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                          Obtenu le {new Date(certificate.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04L12 21.944l9.618-13.96A11.955 11.955 0 0112 2.944z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="-mt-px flex divide-x divide-gray-200 dark:divide-gray-600">
                        <div className="w-0 flex-1 flex">
                          <a
                            href={certificate.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 dark:text-gray-300 font-medium border border-transparent rounded-bl-lg hover:text-gray-500 dark:hover:text-white"
                          >
                            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2">Voir</span>
                          </a>
                        </div>
                        <div className="-ml-px w-0 flex-1 flex">
                          <a
                            href={certificate.certificate_url}
                            download
                            className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 dark:text-gray-300 font-medium border border-transparent rounded-br-lg hover:text-gray-500 dark:hover:text-white"
                          >
                            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2">Télécharger</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Section de suppression de compte */}
        <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-red-600 dark:text-red-400">
              Zone de danger
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Supprimer votre compte
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                Une fois que vous supprimez votre compte, toutes vos données seront définitivement supprimées.
                Cette action ne peut pas être annulée.
              </p>
            </div>
            
            {showConfirmation ? (
              <div className="mt-5">
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-4">
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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
    </div>
  );
} 