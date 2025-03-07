'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function LogoutContent() {
  const [message, setMessage] = useState('Déconnexion en cours...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountDeleted = searchParams.get('account_deleted') === 'true';
  
  useEffect(() => {
    const handleLogout = async () => {
      console.log('Page de déconnexion chargée, paramètre account_deleted:', accountDeleted);
      
      try {
        const supabase = createClient();
        
        // Déconnecter l'utilisateur
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Erreur lors de la déconnexion Supabase:', error);
          } else {
            console.log('Déconnexion Supabase réussie');
          }
        } catch (signOutError) {
          console.error('Exception lors de la déconnexion Supabase:', signOutError);
        }
        
        // Effacer les cookies manuellement
        try {
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          });
          console.log('Cookies effacés');
        } catch (cookieError) {
          console.error('Erreur lors de l\'effacement des cookies:', cookieError);
        }
        
        // Vider le localStorage et sessionStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('Storage local effacé');
        } catch (storageError) {
          console.error('Erreur lors de l\'effacement du storage:', storageError);
        }
        
        // Rediriger vers la page d'accueil avec un message approprié
        if (accountDeleted) {
          setMessage('Votre compte a été supprimé avec succès. Redirection...');
          console.log('Compte supprimé, redirection vers la page d\'accueil');
          
          // Utiliser une redirection forcée pour s'assurer que la page est complètement rechargée
          setTimeout(() => {
            window.location.replace('/?message=account_deleted');
          }, 2000);
        } else {
          setMessage('Vous avez été déconnecté avec succès. Redirection...');
          console.log('Déconnexion réussie, redirection vers la page d\'accueil');
          
          // Utiliser une redirection forcée pour s'assurer que la page est complètement rechargée
          setTimeout(() => {
            window.location.replace('/');
          }, 2000);
        }
      } catch (error) {
        console.error('Erreur globale lors de la déconnexion:', error);
        setMessage('Une erreur est survenue lors de la déconnexion. Redirection...');
        
        // Rediriger quand même en cas d'erreur
        setTimeout(() => {
          window.location.replace('/');
        }, 2000);
      }
    };
    
    handleLogout();
  }, [accountDeleted]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">{message}</p>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Chargement...</p>
      </div>
    }>
      <LogoutContent />
    </Suspense>
  );
} 