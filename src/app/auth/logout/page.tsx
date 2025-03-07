'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function LogoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountDeleted, setIsAccountDeleted] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Vérifier si l'URL contient le paramètre account_deleted
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsAccountDeleted(urlParams.get('account_deleted') === 'true');
    }

    const handleLogout = async () => {
      try {
        // Déconnecter l'utilisateur
        await supabase.auth.signOut();
        
        // Effacer les cookies manuellement
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
        
        // Vider le localStorage et sessionStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (storageError) {
          console.error('Erreur lors de l\'effacement du storage:', storageError);
        }
        
        setIsLoading(false);
        
        // Si ce n'est pas une suppression de compte, rediriger vers la page d'accueil après 2 secondes
        if (!isAccountDeleted) {
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        setIsLoading(false);
      }
    };

    handleLogout();
  }, [router, isAccountDeleted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
              Déconnexion en cours...
            </p>
          </div>
        ) : (
          <div className="text-center">
            {isAccountDeleted ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                  Compte supprimé
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Votre compte a été supprimé avec succès. Nous espérons vous revoir bientôt !
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                  Déconnexion réussie
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Vous avez été déconnecté avec succès. Redirection en cours...
                </p>
              </>
            )}
            
            <div className="mt-8">
              <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 