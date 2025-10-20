import type { NextApiRequest } from "next";
import clientPromise from "@/modules/mongodb";
import { getToken } from "next-auth/jwt";

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

    // Obter token JWT do NextAuth diretamente (não precisa de res)
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 Token recebido:", JSON.stringify(token, null, 2));
    }

    const session = token ? { user: { email: token.email, id: token.sub, permissao: (token as any).permissao } } : null;
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 Sessão derivada do token:", JSON.stringify(session, null, 2));
    }
    
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

/**
 * Verifica se o usuário está autenticado (admin ou usuário normal)
 * @param req - Requisição Next.js
 * @returns Promise<{ isAuthenticated: boolean, isAdmin: boolean, user?: { email: string; name: string; login: string; permissao: string }, error?: string }>
 */
export async function verificarAutenticacao(req: NextApiRequest): Promise<{ isAuthenticated: boolean, isAdmin: boolean, user?: { email: string; name: string; login: string; permissao: string }, error?: string }> {
  try {
    console.log("🔍 === INICIANDO VERIFICAÇÃO DE AUTENTICAÇÃO ===");
    console.log("📝 Método da requisição:", req.method);
    console.log("🔗 URL da requisição:", req.url);
    
    // Verificar se há cookies de sessão
    if (!req.headers.cookie) {
      console.log("🔒 Nenhum cookie de sessão encontrado");
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: "Acesso negado. Você precisa estar logado para acessar esta funcionalidade."
      };
    }

    // Obter token JWT do NextAuth diretamente (não precisa de res)
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const session = token ? { user: { email: token.email, id: token.sub, permissao: (token as any).permissao, login: (token as any).login } } : null;
    console.log("🔍 Dados da sessão recebidos:", JSON.stringify(session, null, 2));
    
    if (!session?.user?.email) {
      console.log("🔒 Sessão inválida - sem email");
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: "Acesso negado. Sessão inválida."
      };
    }

    console.log("🔍 Verificando usuário no banco para:", session.user.email);
    
    // Verificar no banco se o usuário existe e suas permissões
    try {
      const client = await clientPromise;
      const db = client.db("paraiba");
      
      const user = await db.collection("users").findOne({ 
        email: session.user.email
      });
      
      if (!user) {
        console.log("❌ Usuário não encontrado no banco");
        return {
          isAuthenticated: false,
          isAdmin: false,
          error: "Acesso negado. Usuário não encontrado."
        };
      }
      
      const isAdmin = user.permissao === "administrador";
      console.log("👤 Usuário encontrado:", {
        email: user.email,
        permissao: user.permissao,
        nome: user.name,
        isAdmin
      });
      
      console.log("✅ Autenticação verificada com sucesso");
      console.log("🔍 === FIM DA VERIFICAÇÃO DE AUTENTICAÇÃO ===");
      
      return {
        isAuthenticated: true,
        isAdmin,
        user: {
          email: user.email,
          name: user.name,
          login: user.login,
          permissao: user.permissao
        }
      };
    } catch (dbError) {
      console.error("❌ Erro ao conectar com o banco de dados:", dbError);
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: "Erro interno na verificação de permissões."
      };
    }
  } catch (error) {
    console.error("❌ Erro geral ao verificar autenticação:", error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: "Erro interno na verificação de permissões."
    };
  }
}