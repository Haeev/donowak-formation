'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  // Vérifier l'état de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          setIsLoggedIn(true);
          setUserEmail(data.session.user.email || null);
          
          // Récupérer les informations supplémentaires de l'utilisateur
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileData) {
            setIsAdmin(profileData.role === 'admin');
            setUserName(profileData.full_name || data.session.user.email || null);
          }
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setUserEmail(null);
          setUserName(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname]); // Vérifier à chaque changement de page

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Rediriger vers la page d'accueil
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Donowak Formation
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/'
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Accueil
              </Link>
              <Link
                href="/formations"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/formations' || pathname?.startsWith('/formations/')
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Formations
              </Link>
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/dashboard' || pathname?.startsWith('/dashboard/')
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Tableau de bord
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/admin' || pathname?.startsWith('/admin/')
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <ThemeToggle />
            
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500 dark:text-gray-400" />
              </div>
            ) : isLoggedIn ? (
              <>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <span className="sr-only">Ouvrir le menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
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
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
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
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/'
                ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Accueil
          </Link>
          <Link
            href="/formations"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/formations' || pathname?.startsWith('/formations/')
                ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Formations
          </Link>
          {isLoggedIn && (
            <Link
              href="/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/dashboard' || pathname?.startsWith('/dashboard/')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Tableau de bord
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/admin' || pathname?.startsWith('/admin/')
                  ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Admin
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center px-4 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500 dark:text-gray-400" />
            </div>
          ) : isLoggedIn ? (
            <div>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-300 font-medium">
                      {userEmail?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">
                    {userName || userEmail}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {userEmail}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 px-4">
              <Link
                href="/auth/login"
                className="block text-left py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="block text-left py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 