'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const signOut = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
        // Rediriger vers la page d'accueil après déconnexion
        router.push('/');
        router.refresh();
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de la déconnexion');
        // Rediriger vers la page d'accueil même en cas d'erreur après 3 secondes
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 3000);
      }
    };

    signOut();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Déconnexion en cours...
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Vous êtes en train d'être déconnecté.
        </p>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
} 