import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NextAuthProvider } from '@/components/auth/NextAuthProvider';

// Chargement de la police Inter avec le sous-ensemble latin
const inter = Inter({ subsets: ["latin"] });

/**
 * Métadonnées de l'application
 * Ces informations sont utilisées pour le SEO et l'affichage dans les navigateurs
 */
export const metadata: Metadata = {
  title: "Donowak Formation - Développez vos compétences",
  description: "Plateforme de formation en ligne pour développer vos compétences professionnelles",
};

/**
 * Layout racine de l'application
 * Contient les éléments communs à toutes les pages (providers, header, footer)
 * 
 * @param children - Le contenu spécifique à chaque page
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Provider NextAuth pour la gestion de l'authentification */}
        <NextAuthProvider>
          {/* Provider de thème pour le mode clair/sombre */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Structure principale de la page */}
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
