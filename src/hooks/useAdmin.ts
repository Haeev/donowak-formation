import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook personnalisé pour vérifier si l'utilisateur est un administrateur
 * Redirige l'utilisateur vers le dashboard approprié selon son rôle
 * 
 * @param redirectUrl - URL de redirection si l'utilisateur n'est pas administrateur (défaut: '/dashboard')
 * @param adminRedirectUrl - URL de redirection si l'utilisateur est administrateur (défaut: '/admin')
 * @returns { isAdmin, isLoading, error } - État du chargement, statut admin et erreur éventuelle
 */
export default function useAdmin(
  redirectUrl: string = '/dashboard',
  adminRedirectUrl: string = '/admin'
) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // Vérifier si l'utilisateur est authentifié
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw authError;
        }
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Récupérer le profil de l'utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        const userIsAdmin = profile?.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        // Gestion de la redirection en fonction du rôle et du chemin actuel
        if (userIsAdmin) {
          // Si on est sur la page dashboard et l'utilisateur est admin, rediriger vers le dashboard admin
          if (pathname === '/dashboard' || pathname === '/') {
            router.push(adminRedirectUrl);
          }
          // Si on est déjà sur une page admin, ne rien faire
        } else {
          // Si on tente d'accéder à une page admin mais qu'on n'est pas admin, rediriger
          if (pathname?.startsWith('/admin')) {
            router.push(redirectUrl);
          }
        }
      } catch (error: any) {
        console.error('Erreur lors de la vérification des droits admin:', error);
        setError(error.message || 'Une erreur est survenue');
        
        // En cas d'erreur, rediriger vers le dashboard général
        if (pathname?.startsWith('/admin')) {
          router.push(redirectUrl);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [router, redirectUrl, adminRedirectUrl, pathname]);
  
  return { isAdmin, isLoading, error };
} 