import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    console.log("🔍 === DEBUG AUTH API ===");
    console.log("🌐 NODE_ENV:", process.env.NODE_ENV);
    console.log("🔗 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("🍪 Cookies presentes:", !!req.headers.cookie);
    
    if (req.headers.cookie) {
      console.log("🍪 Cookies:", req.headers.cookie.substring(0, 100) + "...");
    }

    // Tentar buscar sessão via getServerSession
    const session = await getServerSession(authOptions);
    console.log("🔍 Sessão via getServerSession:", session);

    // Tentar buscar sessão via fetch
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const sessionUrl = `${baseUrl}/api/auth/session`;
    
    let fetchSession = null;
    try {
      const response = await fetch(sessionUrl, {
        headers: {
          cookie: req.headers.cookie || '',
        },
      });
      
      if (response.ok) {
        fetchSession = await response.json();
        console.log("🔍 Sessão via fetch:", fetchSession);
      } else {
        console.log("❌ Erro no fetch da sessão:", response.status, response.statusText);
      }
    } catch (fetchError) {
      console.log("❌ Erro no fetch:", fetchError);
    }

    return res.status(200).json({
      success: true,
      debug: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasCookies: !!req.headers.cookie,
        sessionViaGetServerSession: session,
        sessionViaFetch: fetchSession,
        cookiePreview: req.headers.cookie ? req.headers.cookie.substring(0, 100) + "..." : null
      }
    });

  } catch (error) {
    console.error("❌ Erro no debug auth:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
