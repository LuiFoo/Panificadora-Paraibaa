import type { NextApiRequest } from "next";
import clientPromise from "@/modules/mongodb";

/**
 * Verifica se o usuário é um administrador válido
 * @param req - Requisição Next.js
 * @returns Promise<boolean> - true se for admin, false caso contrário
 */
export async function verificarAdmin(req: NextApiRequest): Promise<boolean> {
  try {
    // Verificar se há cookies de sessão
    if (!req.headers.cookie) {
      console.log("🔒 Nenhum cookie de sessão encontrado");
      return false;
    }

    // Buscar sessão do NextAuth
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const sessionUrl = `${baseUrl}/api/auth/session`;
    
    console.log("🔍 Verificando sessão em:", sessionUrl);
    
    const response = await fetch(sessionUrl, {
      headers: {
        cookie: req.headers.cookie,
      },
    });
    
    if (!response.ok) {
      console.log("🔒 Falha ao verificar sessão:", response.status, response.statusText);
      return false;
    }
    
    const session = await response.json();
    if (!session?.user?.email) {
      console.log("🔒 Sessão inválida - sem email");
      console.log("🔍 Dados da sessão:", JSON.stringify(session, null, 2));
      return false;
    }

    console.log("🔍 Verificando permissões para:", session.user.email);
    
    // Verificar no banco se o usuário é admin
    try {
      const client = await clientPromise;
      const db = client.db("paraiba");
      const user = await db.collection("users").findOne({ 
        email: session.user.email,
        permissao: "administrador"
      });
      
      const isAdmin = !!user;
      console.log(isAdmin ? "✅ Usuário é admin" : "❌ Usuário não é admin");
      
      return isAdmin;
    } catch (dbError) {
      console.error("❌ Erro ao conectar com o banco de dados:", dbError);
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao verificar admin:", error);
    return false;
  }
}

/**
 * Middleware para proteger APIs de admin
 * @param req - Requisição Next.js
 * @returns Promise<{ isAdmin: boolean, error?: string }>
 */
export async function protegerApiAdmin(req: NextApiRequest): Promise<{ isAdmin: boolean, error?: string }> {
  const isAdmin = await verificarAdmin(req);
  
  if (!isAdmin) {
    return {
      isAdmin: false,
      error: "Acesso negado. Apenas administradores podem acessar esta API."
    };
  }
  
  return { isAdmin: true };
}
