'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Composant qui affiche un message de confirmation après la suppression d'un compte
 * Ce composant vérifie la présence du paramètre 'message=account_deleted' dans l'URL
 * et affiche un message de confirmation si présent
 * 
 * @returns Composant React pour le message de suppression de compte
 */
export default function AccountDeletedMessage() {
  const searchParams = useSearchParams();
  const [showMessage, setShowMessage] = useState(false);
  
  useEffect(() => {
    // Vérifier si le paramètre message=account_deleted est présent dans l'URL
    const message = searchParams.get('message');
    setShowMessage(message === 'account_deleted');
    
    // Si le message est présent, le supprimer de l'URL après quelques secondes
    if (message === 'account_deleted') {
      const timer = setTimeout(() => {
        // Remplacer l'URL sans le paramètre message
        window.history.replaceState({}, '', window.location.pathname);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);
  
  if (!showMessage) {
    return null;
  }
  
  return (
    <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-md border border-green-200 dark:border-green-800 mb-6 flex items-center">
      <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
      <div>
        <h3 className="font-medium">Compte supprimé avec succès</h3>
        <p>Votre compte et toutes vos données ont été supprimés. Nous espérons vous revoir bientôt !</p>
      </div>
    </div>
  );
} 