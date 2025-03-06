'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        console.log('Déconnexion en cours...');
        setIsLoading(true);
        
        // Nettoyer le localStorage
        localStorage.removeItem('donowak_user');
        console.log('Données utilisateur supprimées du localStorage');
        
        // Nettoyer les cookies
        document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; secure';
        document.cookie = 'sb-refresh-token=; path=/; max-age=0; SameSite=Lax; secure';
        console.log('Cookies d\'authentification supprimés');
        
        // Déconnecter l'utilisateur de Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Erreur lors de la déconnexion Supabase:', error.message);
          setError(error.message);
          setIsLoading(false);
          return;
        }
        
        console.log('Déconnexion réussie, redirection...');
        
        // Rediriger vers la page d'accueil après une courte pause
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (err) {
        console.error('Erreur inattendue lors de la déconnexion:', err);
        setError('Une erreur inattendue est survenue lors de la déconnexion.');
        setIsLoading(false);
      }
    };

    handleLogout();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Déconnexion en cours...</p>
        </div>
      ) : error ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Erreur</h1>
          <p className="mt-2">{error}</p>
          <a href="/" className="mt-4 inline-block text-primary hover:underline">
            Retour à l'accueil
          </a>
        </div>
      ) : null}
    </div>
  );
} 