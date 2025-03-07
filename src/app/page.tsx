import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Page d'accueil de l'application
 * Affiche une présentation de la plateforme de formation
 * Adapte l'interface en fonction de l'état d'authentification de l'utilisateur
 */
export default async function Home() {
  // Récupération des cookies pour l'authentification
  const cookieStore = cookies();
  // Création du client Supabase côté serveur
  const supabase = await createClient();
  
  // Vérification de l'état d'authentification de l'utilisateur
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* Section Hero - Présentation principale */}
      <section className="relative flex flex-col items-center justify-center py-20 md:py-32 overflow-hidden">
        {/* Éléments décoratifs animés en arrière-plan */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Contenu principal de la section Hero */}
        <div className="relative z-10 container px-4 md:px-6 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 animate-fade-in">
            Formations professionnelles certifiantes
          </h1>
          <p className="max-w-[700px] text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in animation-delay-300">
            Développez vos compétences et obtenez des certifications reconnues dans votre domaine professionnel.
          </p>
          
          {/* Boutons d'action adaptés à l'état d'authentification */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-600">
            {isLoggedIn ? (
              // Utilisateur connecté : accès au tableau de bord
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/dashboard">
                  Accéder à mon espace
                </Link>
              </Button>
            ) : (
              // Utilisateur non connecté : inscription ou connexion
              <>
                <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link href="/auth/register">
                    Commencer maintenant
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/login">
                    Se connecter
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Section des fonctionnalités */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Pourquoi choisir nos formations ?
          </h2>
          
          {/* Grille des avantages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avantage 1 : Flexibilité */}
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Formations flexibles</h3>
              <p className="text-muted-foreground">Apprenez à votre rythme avec des cours accessibles 24h/24 et 7j/7.</p>
            </div>
            
            {/* Avantage 2 : Certifications */}
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Certifications reconnues</h3>
              <p className="text-muted-foreground">Obtenez des certifications valorisées par les employeurs et les professionnels.</p>
            </div>
            
            {/* Avantage 3 : Experts */}
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Experts du domaine</h3>
              <p className="text-muted-foreground">Apprenez avec des formateurs expérimentés et passionnés par leur métier.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section d'appel à l'action (CTA) */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à développer vos compétences ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez notre plateforme et accédez à des formations de qualité pour booster votre carrière.
            </p>
            
            {/* Bouton d'action adapté à l'état d'authentification */}
            {isLoggedIn ? (
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/dashboard">
                  Voir mes formations
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/auth/register">
                  S'inscrire gratuitement
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
