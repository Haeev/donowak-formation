import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center md:text-left md:flex md:items-center md:justify-between">
              <div className="md:max-w-2xl">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                  Bienvenue sur <span className="text-blue-600 dark:text-blue-400">Donowak Formation</span>
                </h1>
                <p className="mt-5 text-xl text-gray-600 dark:text-gray-300">
                  Votre plateforme de formation en ligne pour développer vos compétences et atteindre vos objectifs professionnels.
                </p>
                <div className="mt-8 flex justify-center md:justify-start space-x-4">
                  <Link href="/formations">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium">
                      Découvrir nos formations
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="outline" size="lg" className="px-6 py-3 rounded-md text-lg font-medium">
                      Créer un compte
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block md:ml-10 mt-10 md:mt-0">
                <div className="relative w-full max-w-lg">
                  <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
                  <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                  <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                  <div className="relative">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className="h-64 w-64 mx-auto relative">
                        <Image 
                          src="/placeholder-hero.svg" 
                          alt="Formation en ligne" 
                          fill 
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pourquoi choisir Donowak Formation ?</h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Nous vous offrons une expérience d'apprentissage complète et adaptée à vos besoins.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 border border-gray-100 dark:border-gray-700 transform transition duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Formations de qualité</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Accédez à des formations créées par des experts dans leur domaine pour un apprentissage optimal.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 border border-gray-100 dark:border-gray-700 transform transition duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Apprentissage flexible</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Apprenez à votre rythme, où que vous soyez, avec un accès illimité à nos contenus.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 border border-gray-100 dark:border-gray-700 transform transition duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Suivi personnalisé</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Suivez votre progression et recevez des recommandations adaptées à votre parcours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 dark:bg-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Prêt à commencer votre parcours d'apprentissage ?</h2>
            <p className="text-xl text-blue-100 mb-8">Rejoignez des milliers d'apprenants qui développent leurs compétences avec nous.</p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-md text-lg font-medium">
                S'inscrire gratuitement
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
