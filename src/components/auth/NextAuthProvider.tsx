'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

/**
 * Provider pour NextAuth.js qui doit être utilisé au niveau du layout racine
 * pour fournir les informations de session à toute l'application
 */
export function NextAuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
} 