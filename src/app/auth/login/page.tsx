'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  // Vérifier si l'utilisateur est déjà connecté
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Si l'utilisateur est déjà connecté, rediriger vers le tableau de bord
    if (status === 'authenticated') {
      console.log("Utilisateur déjà connecté, redirection vers le tableau de bord");
      router.push('/dashboard');
    }
  }, [status, router]);
  
  // Afficher un indicateur de chargement pendant la vérification de la session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Vérification de votre session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Connexion à votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Ou{' '}
          <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            créez un compte si vous n'en avez pas
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Récupérer l'URL de redirection si elle existe
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log("Tentative de connexion avec:", email);
      
      // Utiliser NextAuth.js pour la connexion
      const result = await signIn('credentials', {
        redirect: false, // Ne pas rediriger automatiquement pour pouvoir gérer les erreurs
        email,
        password,
        callbackUrl,
      });
      
      console.log("Résultat de la connexion:", result);
      
      if (result?.error) {
        console.error("Erreur de connexion:", result.error);
        
        // Traduire les messages d'erreur courants
        if (result.error === "CredentialsSignin") {
          throw new Error("Email ou mot de passe incorrect");
        } else {
          throw new Error(result.error);
        }
      }
      
      if (!result?.ok) {
        throw new Error("La connexion a échoué pour une raison inconnue");
      }

      console.log("Connexion réussie!");
      setSuccessMessage("Connexion réussie! Redirection en cours...");
      
      // Attendre un court instant avant de rediriger
      setTimeout(() => {
        // Utiliser window.location pour une redirection complète
        window.location.href = callbackUrl;
      }, 1000);
      
    } catch (error: any) {
      console.error("Erreur complète:", error);
      setError(error.message || "Une erreur est survenue lors de la connexion");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}
      
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <div className="text-sm text-green-700 dark:text-green-400">{successMessage}</div>
        </div>
      )}
      
      <div>
        <Label htmlFor="email">Adresse e-mail</Label>
        <div className="mt-1">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <div className="mt-1">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </div>
    </form>
  );
} 