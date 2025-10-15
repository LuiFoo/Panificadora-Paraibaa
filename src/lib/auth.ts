import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
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
      if (token) {
        session.user.id = token.sub;
        session.user.permissao = (token as { permissao?: string }).permissao || "usuario";
        console.log("✅ Sessão configurada para:", session.user.email);
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
      
      // Se for login com Google, registra/cadastra o usuário no MongoDB
      if (account?.provider === "google" && user) {
        console.log("Processando login do Google...");
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/google-user-register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              googleId: user.id,
              email: user.email,
              name: user.name,
              picture: user.image
            }),
          });

          const data = await response.json();
          if (data.ok) {
            console.log("✅ Usuário processado no MongoDB:", data.user.email);
          } else {
            console.error("❌ Erro ao processar usuário no MongoDB:", data.msg);
          }
        } catch (error) {
          console.error("❌ Erro ao chamar API de registro:", error);
        }
      }
    },
    async session({ session }) {
      console.log("Sessão criada para:", session.user?.email);
    },
  },
};
