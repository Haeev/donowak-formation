'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Database } from '@/types/database.types';

/**
 * Schéma de validation pour le formulaire de connexion
 * Définit les règles de validation pour l'email et le mot de passe
 */
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

/**
 * Type pour les valeurs du formulaire de connexion
 * Généré à partir du schéma Zod
 */
type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Composant de formulaire de connexion
 * Gère l'authentification des utilisateurs via Supabase
 */
export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialisation du client Supabase côté navigateur
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Configuration du formulaire avec React Hook Form et validation Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Gère la soumission du formulaire
   * Tente de connecter l'utilisateur avec Supabase
   * @param data - Les données du formulaire validées
   */
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Tentative de connexion avec email/mot de passe
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      // Gestion des erreurs de connexion
      if (error) {
        setError(error.message);
        return;
      }

      // Rafraîchir la page et rediriger vers le tableau de bord
      router.refresh();
      router.push('/dashboard');
    } catch (error) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      <div className="space-y-4 rounded-md shadow-sm">
        {/* Champ email */}
        <div>
          <label htmlFor="email" className="sr-only">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Adresse email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        {/* Champ mot de passe */}
        <div>
          <label htmlFor="password" className="sr-only">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Mot de passe"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      {/* Lien mot de passe oublié */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <a href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Mot de passe oublié ?
          </a>
        </div>
      </div>

      {/* Bouton de soumission */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full justify-center rounded-md bg-blue-600 py-2 px-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70"
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </div>
    </form>
  );
} 