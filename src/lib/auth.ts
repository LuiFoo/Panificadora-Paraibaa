import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/modules/mongodb";

// Estender tipos do NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      permissao?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      console.log("=== CALLBACK SIGNIN ===");
      console.log("User:", user.email);
      console.log("Account provider:", account?.provider);
      
      // Permite login apenas com Google
      if (account?.provider === "google") {
        console.log("✅ Login com Google autorizado");
        return true;
      }
      console.log("❌ Login rejeitado - não é Google");
      return false;
    },
    async session({ session, token }) {
      console.log("=== CALLBACK SESSION ===");
      console.log("Session user:", session.user?.email);
      console.log("Token:", token);
      
      // Adiciona informações extras do usuário na sessão
      if (token && session.user && token.sub && session.user.email) {
        session.user.id = token.sub;
        
        // Buscar permissão atual do banco de dados
        try {
          const client = await clientPromise;
          const db = client.db("paraiba");
          const user = await db.collection("users").findOne({ 
            email: session.user.email 
          });
          
          if (user) {
            session.user.permissao = user.permissao || "usuario";
            console.log("✅ Permissão atualizada do banco:", session.user.permissao);
          } else {
            session.user.permissao = "usuario";
            console.log("⚠️ Usuário não encontrado no banco, usando permissão padrão");
          }
        } catch (error) {
          console.error("❌ Erro ao buscar permissão do banco:", error);
          session.user.permissao = (token as { permissao?: string }).permissao || "usuario";
        }
        
        console.log("✅ Sessão configurada para:", session.user.email, "com permissão:", session.user.permissao);
      }
      return session;
    },
    async jwt({ token, user, account }) {
      console.log("=== CALLBACK JWT ===");
      console.log("Token:", token);
      console.log("User:", user?.email);
      console.log("Account:", account?.provider);
      
      if (user) {
        token.permissao = "usuario";
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log("=== CALLBACK REDIRECT ===");
      console.log("URL:", url);
      console.log("Base URL:", baseUrl);
      
      // Se a URL é relativa, usa a base URL
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Se a URL é do mesmo domínio, permite
      if (url.startsWith(baseUrl)) return url;
      // Caso contrário, redireciona para a base URL
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  events: {
    async signIn({ user, account }) {
      console.log("=== USUÁRIO FEZ LOGIN ===");
      console.log("Email:", user.email);
      console.log("Google ID:", user.id);
      console.log("Nome:", user.name);
      console.log("Provider:", account?.provider);
      
      // O processamento do usuário será feito pelo useAuthSync
      // para evitar chamadas duplicadas
    },
    async session({ session }) {
      console.log("Sessão criada para:", session.user?.email);
    },
  },
};
