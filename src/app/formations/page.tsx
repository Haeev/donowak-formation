import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600; // Revalider la page toutes les heures

export default async function FormationsPage({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | undefined
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabase = await createClient();
  
  // Récupérer les formations publiées
  const { data: formations, error } = await supabase
    .from('formations')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erreur lors de la récupération des formations:', error);
  }
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Nos formations
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300 sm:mt-4">
            Découvrez nos formations pour développer vos compétences et accélérer votre carrière.
          </p>
        </div>
        
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {formations && formations.length > 0 ? (
            formations.map((formation) => (
              <div
                key={formation.id}
                className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800 transition-transform hover:scale-[1.02]"
              >
                <div className="flex-shrink-0 h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
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
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <Link href={`/formations/${formation.id}`} className="block">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {formation.title}
                      </h3>
                      <p className="mt-3 text-base text-gray-500 dark:text-gray-300 line-clamp-3">
                        {formation.description}
                      </p>
                    </Link>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {formation.duration} heures
                        </span>
                      </div>
                      <div className="ml-2">
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          {formation.price === 0 ? 'Gratuit' : `${formation.price} €`}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/formations/${formation.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                Une erreur est survenue
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Impossible de charger les formations. Veuillez réessayer plus tard.
              </p>
            </div>
          ) : (
            <div className="col-span-full text-center py-12">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucune formation disponible
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                De nouvelles formations seront bientôt disponibles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 