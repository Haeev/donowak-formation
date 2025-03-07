import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@/lib/supabase/client';
import { User } from 'next-auth';

/**
 * Type étendu pour l'utilisateur NextAuth avec les propriétés Supabase
 */
interface ExtendedUser extends User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  supabaseAccessToken?: string;
  supabaseRefreshToken?: string;
}

/**
 * Configuration de NextAuth.js pour l'authentification
 * Utilise Supabase comme backend d'authentification via le provider Credentials
 * Gère également les redirections en fonction de l'état d'authentification
 */
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Informations d'identification manquantes");
          return null;
        }
        
        try {
          console.log("Tentative de connexion avec Supabase pour:", credentials.email);
          const supabase = createClient();
          
          // Vérifier si les variables d'environnement Supabase sont définies
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("Variables d'environnement Supabase manquantes");
            throw new Error("Configuration du serveur incorrecte");
          }
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });
          
          if (error) {
            console.error("Erreur d'authentification Supabase:", error.message);
            throw new Error(error.message);
          }
          
          if (!data.user) {
            console.log("Aucun utilisateur retourné par Supabase");
            return null;
          }
          
          console.log("Authentification réussie pour:", data.user.email);
          
          // Récupérer les informations supplémentaires du profil
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.warn("Erreur lors de la récupération du profil:", profileError.message);
          }
          
          // Retourner les données utilisateur pour la session
          const user: ExtendedUser = {
            id: data.user.id,
            email: data.user.email || '',  // S'assurer que l'email n'est jamais undefined
            name: data.user.user_metadata?.full_name || data.user.email || '',
            role: profileData?.role || 'user',
            supabaseAccessToken: data.session?.access_token,
            supabaseRefreshToken: data.session?.refresh_token
          };
          
          return user;
        } catch (error: any) {
          console.error("Erreur lors de l'authentification:", error.message);
          // Ne pas retourner null ici, mais laisser l'erreur se propager
          throw new Error(error.message || "Erreur d'authentification");
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Ajouter les informations utilisateur au token JWT
      if (user) {
        console.log("JWT callback - Utilisateur trouvé:", user.email);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.supabaseAccessToken = user.supabaseAccessToken;
        token.supabaseRefreshToken = user.supabaseRefreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Ajouter les informations du token à la session
      if (token && session.user) {
        console.log("Session callback - Token trouvé pour:", token.email);
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.supabaseAccessToken = token.supabaseAccessToken;
        session.supabaseRefreshToken = token.supabaseRefreshToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Gérer les redirections après authentification
      console.log("NextAuth - Redirection:", { url, baseUrl });
      
      // Si l'URL est relative, la préfixer avec l'URL de base
      if (url.startsWith('/')) {
        const fullUrl = `${baseUrl}${url}`;
        console.log("Redirection vers URL relative:", fullUrl);
        return fullUrl;
      }
      // Si l'URL est déjà absolue mais sur le même site, la retourner telle quelle
      else if (url.startsWith(baseUrl)) {
        console.log("Redirection vers URL absolue sur le même site:", url);
        return url;
      }
      // Sinon, rediriger vers la page d'accueil
      console.log("Redirection vers l'URL de base:", baseUrl);
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  debug: true, // Activer le mode debug pour voir les logs détaillés
});

export { handler as GET, handler as POST }; 