import type { NextApiRequest } from "next";
import clientPromise from "@/modules/mongodb";

/**
 * Verifica se o usuário é um administrador válido
 * @param req - Requisição Next.js
 * @returns Promise<boolean> - true se for admin, false caso contrário
 */
export async function verificarAdmin(req: NextApiRequest): Promise<boolean> {
  try {
    console.log("🔍 === INICIANDO VERIFICAÇÃO DE ADMIN ===");
    console.log("🌐 NODE_ENV:", process.env.NODE_ENV);
    console.log("🔗 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("🍪 Cookies presentes:", !!req.headers.cookie);
    
    // Verificar se há cookies de sessão
    if (!req.headers.cookie) {
      console.log("🔒 Nenhum cookie de sessão encontrado");
      return false;
    }

    // Buscar sessão do NextAuth
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const sessionUrl = `${baseUrl}/api/auth/session`;
    
    console.log("🔍 Verificando sessão em:", sessionUrl);
    console.log("🍪 Cookies enviados:", req.headers.cookie.substring(0, 100) + "...");
    
    const response = await fetch(sessionUrl, {
      headers: {
        cookie: req.headers.cookie,
      },
    });
    
    console.log("📡 Status da resposta da sessão:", response.status, response.statusText);
    
    if (!response.ok) {
      console.log("🔒 Falha ao verificar sessão:", response.status, response.statusText);
      const errorText = await response.text();
      console.log("📄 Resposta de erro:", errorText);
      return false;
    }
    
    const session = await response.json();
    console.log("🔍 Dados da sessão recebidos:", JSON.stringify(session, null, 2));
    
    if (!session?.user?.email) {
      console.log("🔒 Sessão inválida - sem email");
      return false;
    }

    console.log("🔍 Verificando permissões para:", session.user.email);
    
    // Verificar no banco se o usuário é admin
    try {
      console.log("🗄️ Conectando ao MongoDB...");
      const client = await clientPromise;
      const db = client.db("paraiba");
      
      console.log("🔍 Buscando usuário no banco...");
      const user = await db.collection("users").findOne({ 
        email: session.user.email,
        permissao: "administrador"
      });
      
      console.log("👤 Usuário encontrado:", !!user);
      if (user) {
        console.log("👤 Dados do usuário:", {
          email: user.email,
          permissao: user.permissao,
          nome: user.name
        });
      }
      
      const isAdmin = !!user;
      console.log(isAdmin ? "✅ Usuário é admin" : "❌ Usuário não é admin");
      console.log("🔍 === FIM DA VERIFICAÇÃO DE ADMIN ===");
      
      return isAdmin;
    } catch (dbError) {
      console.error("❌ Erro ao conectar com o banco de dados:", dbError);
      return false;
    }
  } catch (error) {
    console.error("❌ Erro geral ao verificar admin:", error);
    return false;
  }
}

/**
 * Middleware para proteger APIs de admin
 * @param req - Requisição Next.js
 * @returns Promise<{ isAdmin: boolean, error?: string }>
 */
export async function protegerApiAdmin(req: NextApiRequest): Promise<{ isAdmin: boolean, error?: string }> {
  try {
    console.log("🛡️ === INICIANDO PROTEÇÃO DE API ADMIN ===");
    console.log("📝 Método da requisição:", req.method);
    console.log("🔗 URL da requisição:", req.url);
    
    const isAdmin = await verificarAdmin(req);
    
    if (!isAdmin) {
      const errorMsg = "Acesso negado. Apenas administradores podem acessar esta API.";
      console.log("❌", errorMsg);
      console.log("🛡️ === FIM DA PROTEÇÃO DE API ADMIN (NEGADO) ===");
      
      return {
        isAdmin: false,
        error: errorMsg
      };
    }
    
    console.log("✅ Acesso de admin autorizado");
    console.log("🛡️ === FIM DA PROTEÇÃO DE API ADMIN (AUTORIZADO) ===");
    
    return { isAdmin: true };
  } catch (error) {
    console.error("❌ Erro na proteção de API admin:", error);
    return {
      isAdmin: false,
      error: "Erro interno na verificação de permissões."
    };
  }
}
