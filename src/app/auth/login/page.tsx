'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Page de connexion
 * Permet aux utilisateurs de se connecter à l'application
 * Redirige automatiquement les administrateurs vers le tableau de bord d'admin
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Vérifier si l'utilisateur est déjà connecté au chargement de la page
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la vérification de la session:", error);
          setIsLoading(false);
          return;
        }
        
        if (data.session) {
          console.log("Utilisateur déjà connecté, redirection vers le tableau de bord");
          // Vérifier le rôle de l'utilisateur
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
          
          if (!error && profile) {
            // Rediriger vers le dashboard approprié selon le rôle
            if (profile.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          } else {
            router.push('/dashboard');
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur:", error);
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [router]);
  
  // Afficher un indicateur de chargement pendant la vérification de la session
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Gérer la soumission du formulaire de connexion
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }
      
      setSuccessMessage("Connexion réussie! Redirection en cours...");
      
      // Récupérer le profil après connexion
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (!profileError && profile) {
          // Rediriger vers le dashboard approprié selon le rôle
          if (profile.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      }
      
    } catch (error: any) {
      setErrorMessage(error.message || "Une erreur s'est produite lors de la connexion");
      setIsLoading(false);
    }
  };
  
  // URL de redirection après connexion
  const callbackUrl = '/dashboard';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <Link href="/" className="mb-6 text-2xl font-bold text-center text-primary">
        Donowak Formation
      </Link>
      
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Connexion</h1>
          <p className="text-muted-foreground">
            Entrez vos identifiants pour accéder à votre compte
          </p>
        </div>
        
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@domaine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 