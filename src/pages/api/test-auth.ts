import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    console.log("🧪 === TESTE DE AUTENTICAÇÃO ===");
    console.log("🌐 NODE_ENV:", process.env.NODE_ENV);
    console.log("🔗 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("🔑 NEXTAUTH_SECRET configurado:", !!process.env.NEXTAUTH_SECRET);
    console.log("🍪 Cookies presentes:", !!req.headers.cookie);
    
    if (req.headers.cookie) {
      console.log("🍪 Cookies:", req.headers.cookie.substring(0, 200) + "...");
    }

    // Tentar obter a sessão usando getServerSession
    console.log("🔍 Tentando obter sessão com getServerSession...");
    const session = await getServerSession(req, res, authOptions);
    
    console.log("📊 Sessão obtida:", session ? "SIM" : "NÃO");
    
    if (session) {
      console.log("👤 Dados da sessão:", {
        email: session.user?.email,
        name: session.user?.name,
        permissao: (session.user as { permissao?: string })?.permissao
      });
    }

    // Também tentar com fetch direto
    console.log("🔍 Tentando obter sessão com fetch direto...");
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const sessionUrl = `${baseUrl}/api/auth/session`;
    
    let fetchSession = null;
    try {
      const response = await fetch(sessionUrl, {
        headers: {
          cookie: req.headers.cookie || "",
        },
      });
      
      if (response.ok) {
        fetchSession = await response.json();
        console.log("📊 Sessão via fetch:", fetchSession ? "SIM" : "NÃO");
      } else {
        console.log("❌ Erro no fetch da sessão:", response.status, response.statusText);
      }
    } catch (fetchError) {
      console.error("❌ Erro no fetch da sessão:", fetchError);
    }

    return res.status(200).json({
      success: true,
      debug: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasCookies: !!req.headers.cookie,
        sessionViaGetServerSession: !!session,
        sessionViaFetch: !!fetchSession,
        sessionData: session ? {
          email: session.user?.email,
          name: session.user?.name,
          permissao: (session.user as { permissao?: string })?.permissao
        } : null,
        fetchSessionData: fetchSession ? {
          email: fetchSession.user?.email,
          name: fetchSession.user?.name,
          permissao: fetchSession.user?.permissao
        } : null
      }
    });

  } catch (error) {
    console.error("❌ Erro no teste de autenticação:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
