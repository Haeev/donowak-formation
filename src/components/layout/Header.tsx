'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { Loader2 } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckAttempts = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Fonction pour définir un timeout sur le chargement
  const setLoadingWithTimeout = (loading: boolean) => {
    if (loading) {
      setIsLoading(true);
      // Définir un timeout pour éviter un chargement infini
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('Timeout de chargement atteint, réinitialisation de l\'état');
        setIsLoading(false);
        // Si nous sommes sur une page protégée, rediriger vers la connexion
        if (pathname?.startsWith('/dashboard')) {
          window.location.href = '/auth/login';
        }
      }, 5000); // 5 secondes maximum de chargement
    } else {
      setIsLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };

  // Fonction pour vérifier les cookies manuellement
  const checkCookies = () => {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const hasAccessToken = cookies.some(cookie => cookie.startsWith('sb-access-token='));
    const hasRefreshToken = cookies.some(cookie => cookie.startsWith('sb-refresh-token='));
    
    console.log('Vérification des cookies:');
    console.log('- Access Token:', hasAccessToken ? 'Présent' : 'Absent');
    console.log('- Refresh Token:', hasRefreshToken ? 'Présent' : 'Absent');
    
    return hasAccessToken && hasRefreshToken;
  };

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Vérification de l\'authentification...');
      authCheckAttempts.current += 1;
      console.log(`Tentative #${authCheckAttempts.current}`);
      
      setLoadingWithTimeout(true);
      setAuthError(null);
      
      try {
        // Vérifier les cookies manuellement
        const hasCookies = checkCookies();
        
        if (!hasCookies && authCheckAttempts.current > 1) {
          console.log('Aucun cookie d\'authentification trouvé après plusieurs tentatives');
          setIsLoggedIn(false);
          setIsAdmin(false);
          setLoadingWithTimeout(false);
          
          // Si nous sommes sur une page protégée, rediriger vers la connexion
          if (pathname?.startsWith('/dashboard')) {
            window.location.href = '/auth/login';
          }
          return;
        }
        
        // Étape 1: Vérifier la session actuelle
        console.log('Étape 1: Vérification de la session');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Erreur de session: ${sessionError.message}`);
        }
        
        console.log('Session:', sessionData.session ? 'Trouvée' : 'Non trouvée');
        
        // Étape 2: Si pas de session, essayer de récupérer l'utilisateur
        if (!sessionData.session) {
          console.log('Étape 2: Tentative de récupération de l\'utilisateur');
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw new Error(`Erreur utilisateur: ${userError.message}`);
          }
          
          console.log('Utilisateur:', userData.user ? 'Trouvé' : 'Non trouvé');
          
          if (!userData.user) {
            // Si nous n'avons pas d'utilisateur mais que nous avons des cookies, il y a un problème
            if (hasCookies) {
              console.log('Cookies présents mais pas d\'utilisateur, tentative de rafraîchissement');
              // Essayer de rafraîchir la session
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError || !refreshData.session) {
                console.error('Échec du rafraîchissement de la session:', refreshError);
                // Nettoyer les cookies si le rafraîchissement échoue
                document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; secure';
                document.cookie = 'sb-refresh-token=; path=/; max-age=0; SameSite=Lax; secure';
                setIsLoggedIn(false);
              } else {
                console.log('Session rafraîchie avec succès');
                setIsLoggedIn(true);
                
                // Vérifier le rôle de l'utilisateur
                if (refreshData.user) {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', refreshData.user.id)
                    .single();
                  
                  setIsAdmin(profileData?.role === 'admin');
                }
              }
            } else {
              setIsLoggedIn(false);
              setIsAdmin(false);
            }
          } else {
            setIsLoggedIn(true);
            
            // Vérifier le rôle de l'utilisateur
            console.log('Vérification du rôle pour:', userData.user.id);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userData.user.id)
              .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('Erreur lors de la récupération du profil:', profileError);
            }
            
            setIsAdmin(profileData?.role === 'admin');
          }
        } else {
          // Session trouvée
          console.log('Session trouvée pour:', sessionData.session.user.id);
          setIsLoggedIn(true);
          
          // Vérifier le rôle de l'utilisateur
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', sessionData.session.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Erreur lors de la récupération du profil:', profileError);
          }
          
          setIsAdmin(profileData?.role === 'admin');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        setAuthError(error instanceof Error ? error.message : 'Erreur inconnue');
        setIsLoggedIn(false);
        setIsAdmin(false);
      } finally {
        console.log('Fin de la vérification d\'authentification');
        setLoadingWithTimeout(false);
      }
    };
    
    checkAuth();

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Événement d\'authentification:', event);
        
        // Réinitialiser l'état de chargement pour les événements importants
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          setLoadingWithTimeout(false);
        }
        
        // Mettre à jour l'état de connexion
        setIsLoggedIn(!!session);
        
        if (session) {
          try {
            // Vérifier le rôle de l'utilisateur
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (userError && userError.code !== 'PGRST116') {
              console.warn('Erreur lors de la récupération du rôle:', userError);
            }
            
            setIsAdmin(userData?.role === 'admin');
          } catch (error) {
            console.error('Erreur lors de la récupération du rôle:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      }
    );
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  const handleLogout = async () => {
    setLoadingWithTimeout(true);
    try {
      // Déconnexion via Supabase
      await supabase.auth.signOut();
      
      // Nettoyer manuellement les cookies
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; secure';
      document.cookie = 'sb-refresh-token=; path=/; max-age=0; SameSite=Lax; secure';
      
      // Utiliser window.location pour un rechargement complet
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setLoadingWithTimeout(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Limiter le temps de chargement à 5 secondes maximum
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Donowak Formation</span>
            </Link>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/formations"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/formations' || pathname.startsWith('/formations/')
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Formations
              </Link>
              <Link
                href="/blog"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/blog' || pathname.startsWith('/blog/')
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/contact'
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Contact
              </Link>
            </nav>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <ThemeToggle />
            {isLoading ? (
              <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-400">
                Chargement...
              </div>
            ) : isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Mon espace
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Ouvrir le menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/formations"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/formations' || pathname.startsWith('/formations/')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-800'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              Formations
            </Link>
            <Link
              href="/blog"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/blog' || pathname.startsWith('/blog/')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-800'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/contact'
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-800'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              Contact
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              {isLoading ? (
                <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-400">
                  Chargement...
                </div>
              ) : isLoggedIn ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
                      onClick={closeMenu}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={closeMenu}
                  >
                    Mon espace
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMenu();
                    }}
                    className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={closeMenu}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={closeMenu}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 