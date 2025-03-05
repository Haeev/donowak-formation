import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Donowak Formation</h1>
          <div className="flex space-x-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
              Connexion
            </Link>
            <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Bienvenue sur Donowak Formation
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Votre plateforme de formation en ligne pour développer vos compétences et atteindre vos objectifs professionnels.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium">
                Commencer maintenant
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Formations de qualité</h3>
              <p className="text-gray-600">
                Accédez à des formations créées par des experts dans leur domaine pour un apprentissage optimal.
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Apprentissage flexible</h3>
              <p className="text-gray-600">
                Apprenez à votre rythme, où que vous soyez, avec un accès illimité à nos contenus.
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Suivi personnalisé</h3>
              <p className="text-gray-600">
                Suivez votre progression et recevez des recommandations adaptées à votre parcours.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; {new Date().getFullYear()} Donowak Formation. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
