import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extension du type User pour inclure des propriétés supplémentaires
   */
  interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }

  /**
   * Extension du type Session pour inclure des propriétés supplémentaires
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string;
      role?: string;
    };
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extension du type JWT pour inclure des propriétés supplémentaires
   */
  interface JWT {
    id: string;
    email: string;
    name?: string;
    role?: string;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }
} 