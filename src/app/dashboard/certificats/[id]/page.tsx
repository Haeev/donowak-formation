'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Formation = Database['public']['Tables']['formations']['Row'];
type Certificate = Database['public']['Tables']['certificates']['Row'];

interface CertificateWithFormation extends Certificate {
  formation: Formation;
}

interface PageProps {
  params: Promise<{ id: string }> | undefined;
}

export default function CertificateDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateWithFormation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formationId, setFormationId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function initialize() {
      try {
        // Résoudre les paramètres s'ils sont une Promise
        const resolvedParams = params ? await params : { id: '' };
        
        if (!resolvedParams.id) {
          setError("Identifiant de formation manquant");
          setLoading(false);
          return;
        }
        
        setFormationId(resolvedParams.id);
        
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user && resolvedParams.id) {
          fetchCertificate(user.id, resolvedParams.id);
        } else if (!user) {
          setLoading(false);
          router.push('/auth/login');
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        setError("Une erreur est survenue lors du chargement du certificat");
        setLoading(false);
      }
    }

    initialize();
  }, [supabase, params, router]);

  const fetchCertificate = async (userId: string, formationId: string) => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur a terminé la formation
      const { data: userProgress, error: progressError } = await supabase
        .from('user_formations')
        .select('*')
        .eq('user_id', userId)
        .eq('formation_id', formationId)
        .single();

      if (progressError || !userProgress) {
        setError("Vous n'avez pas accès à cette formation.");
        setLoading(false);
        return;
      }

      // Récupérer le certificat s'il existe
      const { data: certificateData, error: certError } = await supabase
        .from('certificates')
        .select(`
          *,
          formation:formation_id (*)
        `)
        .eq('user_id', userId)
        .eq('formation_id', formationId)
        .single();

      if (certError) {
        // Si le certificat n'existe pas, on le crée
        if (certError.code === 'PGRST116') {
          await generateCertificate(userId, formationId);
          return;
        }
        
        setError("Une erreur est survenue lors de la récupération du certificat.");
        setLoading(false);
        return;
      }

      if (certificateData && certificateData.formation) {
        setCertificate({
          ...certificateData,
          formation: certificateData.formation as unknown as Formation
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du certificat:', error);
      setError("Une erreur est survenue lors de la récupération du certificat.");
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (userId: string, formationId: string) => {
    try {
      // Récupérer les informations de la formation
      const { data: formation, error: formationError } = await supabase
        .from('formations')
        .select('*')
        .eq('id', formationId)
        .single();

      if (formationError || !formation) {
        setError("Formation introuvable.");
        setLoading(false);
        return;
      }

      // Créer un nouveau certificat
      const { data: newCertificate, error: insertError } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          formation_id: formationId,
          issued_at: new Date().toISOString(),
          certificate_url: null // Sera généré par un processus asynchrone
        })
        .select()
        .single();

      if (insertError || !newCertificate) {
        setError("Impossible de générer le certificat.");
        setLoading(false);
        return;
      }

      // Récupérer à nouveau le certificat avec les informations de la formation
      fetchCertificate(userId, formationId);
    } catch (error) {
      console.error('Erreur lors de la génération du certificat:', error);
      setError("Une erreur est survenue lors de la génération du certificat.");
      setLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            {error}
          </h3>
          <div className="mt-6">
            <Link
              href="/dashboard/formations"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à mes formations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Certificat introuvable
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Le certificat demandé n'existe pas ou vous n'y avez pas accès.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/formations"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à mes formations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Certificat
        </h1>
        <Link
          href="/dashboard/certificats"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Tous mes certificats
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-24 w-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-12 w-12 text-blue-600 dark:text-blue-300"
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
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Certificat d'accomplissement
            </h2>
            
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 text-center">
              Ce certificat est décerné à
            </p>
            
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white text-center">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-6 mb-8">
            <p className="text-center text-gray-600 dark:text-gray-300">
              Pour avoir complété avec succès la formation
            </p>
            
            <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white text-center">
              {certificate.formation.title}
            </h3>
            
            <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
              Délivré le {formatDate(certificate.issued_at)}
            </p>
            
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Identifiant du certificat: {certificate.id}
            </p>
          </div>
          
          <div className="flex justify-center">
            {certificate.certificate_url ? (
              <a
                href={certificate.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Télécharger le certificat (PDF)
              </a>
            ) : (
              <div className="text-center">
                <div className="animate-pulse flex space-x-4 items-center mb-4">
                  <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Génération du certificat en cours...
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Votre certificat est en cours de génération. Veuillez revenir dans quelques instants.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 