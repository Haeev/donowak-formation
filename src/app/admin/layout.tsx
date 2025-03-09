'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  BookOpen, 
  BarChart2, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home,
  User,
  FileText,
  Terminal,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useAdmin from '@/hooks/useAdmin';
import { createClient } from '@/lib/supabase/client';

/**
 * Layout pour le tableau de bord d'administration
 * Fournit une mise en page commune pour toutes les pages d'administration
 * Inclut la vérification des droits d'administrateur
 * 
 * @param children - Contenu de la page
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();
  const { isAdmin, isLoading, error } = useAdmin();
  
  useEffect(() => {
    const fetchUserName = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', session.user.id)
          .single();
        
        setUserName(data?.full_name || data?.email || 'Administrateur');
      }
    };
    
    fetchUserName();
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const NavLink = ({ href, icon: Icon, text }: { href: string; icon: any; text: string }) => {
    const isActive = pathname === href;
    
    return (
      <Link
        href={href}
        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Icon className="h-5 w-5 mr-3" />
        <span>{text}</span>
      </Link>
    );
  };
  
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };
  
  // Afficher un écran de chargement pendant la vérification des droits
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex flex-col flex-1 items-center justify-center p-4">
          <Skeleton className="h-12 w-12 rounded-full mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <Card className="w-full max-w-4xl p-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  // Afficher un message d'erreur si la vérification a échoué
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur d'accès</h2>
          <p className="mb-6">{error}</p>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </Card>
      </div>
    );
  }
  
  // Afficher uniquement si l'utilisateur est administrateur
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barre latérale mobile */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />
      
      {/* Barre latérale */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-auto`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <Link href="/admin" className="flex items-center space-x-2">
              <Terminal className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Admin DonowakF</span>
            </Link>
            <button
              className="lg:hidden"
              onClick={toggleSidebar}
              aria-label="Fermer le menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              <NavLink href="/admin" icon={Home} text="Tableau de bord" />
              <NavLink href="/admin/users" icon={Users} text="Utilisateurs" />
              <NavLink href="/admin/formations" icon={BookOpen} text="Formations" />
              <NavLink href="/admin/statistics" icon={BarChart2} text="Statistiques" />
              <NavLink href="/admin/content" icon={FileText} text="Contenu du site" />
              <NavLink href="/admin/database" icon={Database} text="Base de données" />
              <NavLink href="/admin/settings" icon={Settings} text="Paramètres" />
            </nav>
          </div>
          
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrateur</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Contenu principal */}
      <div className="flex-1">
        {/* En-tête */}
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex items-center justify-between">
          <button
            className="lg:hidden"
            onClick={toggleSidebar}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Voir le site</Link>
            </Button>
          </div>
        </header>
        
        {/* Contenu de la page */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 