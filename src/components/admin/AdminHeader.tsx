'use client';

import { Fragment, useState } from 'react';
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Menu,
  Home,
  Users,
  BookOpen,
  HelpCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Définir les liens de navigation pour l'admin
const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Formations', href: '/admin/formations', icon: BookOpen },
  { name: 'Quiz', href: '/admin/quiz', icon: HelpCircle },
  { name: 'Statistiques', href: '/admin/quiz-stats', icon: BarChart2 },
];

export default function AdminHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { supabase, user } = useSupabase();

  // Fonction pour déconnecter l'utilisateur
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/admin" className="-m-1.5 p-1.5">
            <span className="sr-only">Donowak Formation</span>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Donowak Formation"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg">Admin</span>
            </div>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Ouvrir le menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center text-sm font-medium gap-1.5 py-2 px-3 rounded-md",
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'Admin'} />
                  <AvatarFallback>{user?.email?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-0.5 leading-none">
                  {user?.email && (
                    <p className="font-medium text-sm text-foreground">{user.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Administrateur</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Dashboard utilisateur</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
              <span className="sr-only">Donowak Formation</span>
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Donowak Formation"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="font-semibold text-lg">Admin</span>
              </div>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Fermer le menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center text-sm font-medium gap-1.5 py-2 px-3 rounded-md",
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
              
              <div className="py-6">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'Admin'} />
                    <AvatarFallback>{user?.email?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div>
                    {user?.email && (
                      <p className="font-medium text-sm">{user.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Administrateur</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm leading-6 text-gray-700 hover:bg-gray-50 rounded-md px-3 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Dashboard utilisateur
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 text-sm leading-6 text-gray-700 hover:bg-gray-50 rounded-md px-3 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 text-sm leading-6 text-red-600 hover:bg-gray-50 rounded-md px-3 py-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
} 