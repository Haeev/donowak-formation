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
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });
          
          if (error) {
            console.error("Erreur d'authentification Supabase:", error.message);
            return null;
          }
          
          if (!data.user) {
            console.log("Aucun utilisateur retourné par Supabase");
            return null;
          }
          
          console.log("Authentification réussie pour:", data.user.email);
          
          // Récupérer les informations supplémentaires du profil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
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
        } catch (error) {
          console.error("Erreur lors de l'authentification:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Ajouter les informations utilisateur au token JWT
      if (user) {
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
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.supabaseAccessToken = token.supabaseAccessToken;
        session.supabaseRefreshToken = token.supabaseRefreshToken;
      }
      return session;
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
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST }; 