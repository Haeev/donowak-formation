'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

/**
 * Provider pour NextAuth.js qui doit être utilisé au niveau du layout racine
 * pour fournir les informations de session à toute l'application.
 * 
 * Ce composant est marqué 'use client' car il utilise des hooks React
 * et doit être rendu côté client.
 * 
 * @param children - Les composants enfants qui auront accès au contexte de session
 */
export function NextAuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
} 