'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Home, Users, BookOpen, HelpCircle, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/admin" className="-m-1.5 p-1.5">
            <span className="sr-only">Donowak Formation</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
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
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link href="/" className="text-sm font-semibold leading-6 text-gray-900">
            Retour au site <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </nav>
      
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-10 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                <span className="sr-only">Donowak Formation</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
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
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
                
                <div className="py-6">
                  <Link
                    href="/"
                    className="block text-sm font-semibold leading-6 text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Retour au site <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 