import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600; // Revalider la page toutes les heures

export default async function FormationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | undefined
}) {
  // Si params est undefined, utiliser un ID par défaut (ou gérer l'erreur)
  const resolvedParams = params ? await params : { id: '' };
  const { id } = resolvedParams;
  
  if (!id) {
    notFound();
  }
  
  const supabase = await createClient();
  
  // Récupérer les détails de la formation
  const { data: formation, error } = await supabase
    .from('formations')
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('id', id)
    .eq('published', true)
    .single();
  
  if (error || !formation) {
    console.error('Erreur lors de la récupération de la formation:', error);
    notFound();
  }
  
  // Récupérer les chapitres de la formation
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('*')
    .eq('formation_id', id)
    .order('position', { ascending: true });
  
  if (chaptersError) {
    console.error('Erreur lors de la récupération des chapitres:', chaptersError);
  }
  
  // Formater le contenu de la formation
  const formationContent = typeof formation.content === 'string' 
    ? JSON.parse(formation.content) 
    : formation.content;
  
  // Formater le nom de l'auteur
  const authorName = formation.profiles 
    ? formation.profiles.full_name || formation.profiles.email
    : 'Auteur inconnu';
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/formations"
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <svg
              className="mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour aux formations
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="h-64 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg
              className="h-32 w-32 text-white"
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
          
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {formation.title}
            </h1>
            
            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-6 space-x-4">
              <div className="flex items-center">
                <svg
                  className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formation.duration} heures
              </div>
              
              <div className="flex items-center">
                <svg
                  className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {authorName}
              </div>
              
              <div className="flex items-center">
                <svg
                  className="mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Mis à jour le {new Date(formation.updated_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
            
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {formation.description}
              </p>
              
              {formationContent && formationContent.overview && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Aperçu de la formation
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {formationContent.overview}
                  </p>
                </div>
              )}
            </div>
            
            {chapters && chapters.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Programme de la formation
                </h2>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`p-4 ${
                        index !== chapters.length - 1
                          ? 'border-b border-gray-200 dark:border-gray-700'
                          : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                          {index + 1}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {chapter.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {chapter.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formation.price === 0 ? 'Gratuit' : `${formation.price} €`}
                </span>
                {formation.price > 0 && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    TVA incluse
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Link
                  href={`/formations/${id}/preview`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Aperçu gratuit
                </Link>
                
                <Link
                  href={formation.price === 0 ? `/formations/${id}/learn` : `/checkout?formation=${id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {formation.price === 0 ? 'Commencer la formation' : 'Acheter maintenant'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 