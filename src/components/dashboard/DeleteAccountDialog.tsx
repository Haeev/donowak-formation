'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Composant de dialogue pour la suppression de compte
 * Affiche une boîte de dialogue avec une confirmation de suppression
 * Requiert que l'utilisateur tape "SUPPRIMER" pour confirmer
 * 
 * @returns Composant React pour la suppression de compte
 */
export default function DeleteAccountDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const CONFIRMATION_TEXT = 'SUPPRIMER';
  
  const handleDeleteAccount = async () => {
    // Vérifier que le texte de confirmation est correct
    if (confirmText !== CONFIRMATION_TEXT) {
      setError(`Veuillez taper "${CONFIRMATION_TEXT}" pour confirmer la suppression`);
      return;
    }
    
    setIsDeleting(true);
    setError('');
    
    try {
      // Appeler l'API de suppression de compte
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la suppression du compte');
      }
      
      // Fermer la boîte de dialogue
      setIsOpen(false);
      
      // Rediriger vers la page d'accueil avec un message de confirmation
      router.push('/?message=account_deleted');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du compte:', error);
      setError(error.message || 'Une erreur est survenue lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
        Zone de danger
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        La suppression de votre compte est irréversible. Toutes vos données seront définitivement supprimées.
      </p>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">
            Supprimer mon compte
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Supprimer votre compte
            </DialogTitle>
            <DialogDescription>
              Cette action est <strong>irréversible</strong>. Votre compte et toutes vos données seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800 my-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              Pour confirmer, veuillez taper <strong>{CONFIRMATION_TEXT}</strong> ci-dessous.
            </p>
          </div>
          
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Tapez "${CONFIRMATION_TEXT}" pour confirmer`}
            className={error ? 'border-red-500' : ''}
            disabled={isDeleting}
          />
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {error}
            </p>
          )}
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmText !== CONFIRMATION_TEXT || isDeleting}
              className="ml-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 