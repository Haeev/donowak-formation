'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 text-center">
      Votre compte a été supprimé avec succès. Nous espérons vous revoir bientôt !
    </div>
  );
} 