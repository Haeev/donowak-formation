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
      try {
        const supabase = createClient();
        
        // Déconnecter l'utilisateur
        await supabase.auth.signOut();
        
        // Effacer les cookies manuellement
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name.includes('supabase') || name.includes('sb-')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
        
        // Rediriger vers la page d'accueil avec un message approprié
        if (accountDeleted) {
          setMessage('Votre compte a été supprimé avec succès. Redirection...');
          window.location.href = '/?message=account_deleted';
        } else {
          setMessage('Vous avez été déconnecté avec succès. Redirection...');
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        setMessage('Une erreur est survenue lors de la déconnexion. Redirection...');
        setTimeout(() => {
          window.location.href = '/';
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