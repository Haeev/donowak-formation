'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Formation = Database['public']['Tables']['formations']['Row'];
type Certificate = Database['public']['Tables']['certificates']['Row'];

interface CertificateWithFormation extends Certificate {
  formation: Formation;
}

export default function CertificatesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateWithFormation[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        fetchCertificates(user.id);
      } else {
        setLoading(false);
      }
    }

    getUser();
  }, [supabase]);

  const fetchCertificates = async (userId: string) => {
    setLoading(true);
    try {
      // Récupérer les certificats de l'utilisateur avec les informations des formations
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          formation:formation_id (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur lors de la récupération des certificats:', error);
        setLoading(false);
        return;
      }

      // Transformer les données pour avoir le bon format
      const certificatesWithFormation: CertificateWithFormation[] = [];
      
      if (data && data.length > 0) {
        for (const cert of data) {
          if (cert.formation) {
            certificatesWithFormation.push({
              ...cert,
              formation: cert.formation as unknown as Formation
            });
          }
        }
      }
      
      setCertificates(certificatesWithFormation);
    } catch (error) {
      console.error('Erreur lors de la récupération des certificats:', error);
    } finally {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mes certificats
        </h1>
        <Link
          href="/dashboard/formations"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Voir mes formations
        </Link>
      </div>

      {certificates.length === 0 ? (
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
            Aucun certificat
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Terminez des formations pour obtenir des certificats.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/formations"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Voir mes formations
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg
                      className="h-8 w-8 text-blue-600 dark:text-blue-300"
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
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                  {certificate.formation.title}
                </h3>
                
                <div className="text-center mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Certificat obtenu
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                  <p>Délivré le {formatDate(certificate.issued_at)}</p>
                  <p className="mt-1">ID: {certificate.id.substring(0, 8)}...</p>
                </div>
                
                <div className="flex justify-center">
                  <a
                    href={certificate.certificate_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={(e) => {
                      if (!certificate.certificate_url) {
                        e.preventDefault();
                        alert('Le certificat est en cours de génération. Veuillez réessayer plus tard.');
                      }
                    }}
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
                    Télécharger
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 