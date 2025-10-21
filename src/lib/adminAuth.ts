import type { NextApiRequest } from "next";
import clientPromise from "@/modules/mongodb";
import { getToken } from "next-auth/jwt";
import { logger } from "./logger";

/**
 * Verifica se o usuário é um administrador válido
 * @param req - Requisição Next.js
 * @returns Promise<boolean> - true se for admin, false caso contrário
 */
export async function verificarAdmin(req: NextApiRequest): Promise<boolean> {
  try {
    logger.dev("🔍 === INICIANDO VERIFICAÇÃO DE ADMIN ===");
    logger.dev("🌐 NODE_ENV:", process.env.NODE_ENV);
    logger.dev("🔗 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    logger.dev("🍪 Cookies presentes:", !!req.headers.cookie);
    
    // Verificar se há cookies de sessão
    if (!req.headers.cookie) {
      logger.dev("🔒 Nenhum cookie de sessão encontrado");
      return false;
    }

    // Obter token JWT do NextAuth diretamente (não precisa de res)
    const token = await getToken({ req: req as NextApiRequest, secret: process.env.NEXTAUTH_SECRET });
    logger.dev("🔍 Token recebido:", JSON.stringify(token, null, 2));

    const session = token ? { user: { email: token.email, id: token.sub, permissao: (token as { permissao?: string }).permissao } } : null;
    logger.dev("🔍 Sessão derivada do token:", JSON.stringify(session, null, 2));
    
    if (!session?.user?.email) {
      logger.dev("🔒 Sessão inválida - sem email");
      return false;
    }

    logger.dev("🔍 Verificando permissões para:", session.user.email);
    
    // Verificar no banco se o usuário é admin
    try {
      logger.dev("🗄️ Conectando ao MongoDB...");
      const client = await clientPromise;
      const db = client.db("paraiba");
      
      logger.dev("🔍 Buscando usuário no banco...");
      const user = await db.collection("users").findOne({ 
        email: session.user.email,
        permissao: "administrador"
      });
      
      logger.dev("👤 Usuário encontrado:", !!user);
      if (user) {
        logger.dev("👤 Dados do usuário:", {
          email: user.email,
          permissao: user.permissao,
          nome: user.name
        });
      }
      
      const isAdmin = !!user;
      logger.dev(isAdmin ? "✅ Usuário é admin" : "❌ Usuário não é admin");
      logger.dev("🔍 === FIM DA VERIFICAÇÃO DE ADMIN ===");
      
      return isAdmin;
    } catch (dbError) {
      logger.error("❌ Erro ao conectar com o banco de dados:", dbError);
      return false;
    }
  } catch (error) {
    logger.error("❌ Erro geral ao verificar admin:", error);
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
    logger.dev("🛡️ === INICIANDO PROTEÇÃO DE API ADMIN ===");
    logger.dev("📝 Método da requisição:", req.method);
    logger.dev("🔗 URL da requisição:", req.url);
    
    const isAdmin = await verificarAdmin(req);
    
    if (!isAdmin) {
      const errorMsg = "Acesso negado. Apenas administradores podem acessar esta API.";
      logger.dev("❌", errorMsg);
      logger.dev("🛡️ === FIM DA PROTEÇÃO DE API ADMIN (NEGADO) ===");
      
      return {
        isAdmin: false,
        error: errorMsg
      };
    }
    
    logger.dev("✅ Acesso de admin autorizado");
    logger.dev("🛡️ === FIM DA PROTEÇÃO DE API ADMIN (AUTORIZADO) ===");
    
    return { isAdmin: true };
  } catch (error) {
    logger.error("❌ Erro na proteção de API admin:", error);
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
    logger.dev("🔍 === INICIANDO VERIFICAÇÃO DE AUTENTICAÇÃO ===");
    logger.dev("📝 Método da requisição:", req.method);
    logger.dev("🔗 URL da requisição:", req.url);
    
    // Verificar se há cookies de sessão
    if (!req.headers.cookie) {
      logger.dev("🔒 Nenhum cookie de sessão encontrado");
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: "Acesso negado. Você precisa estar logado para acessar esta funcionalidade."
      };
    }

    // Obter token JWT do NextAuth diretamente (não precisa de res)
    const token = await getToken({ req: req as NextApiRequest, secret: process.env.NEXTAUTH_SECRET });
    const session = token ? { user: { email: token.email, id: token.sub, permissao: (token as { permissao?: string; login?: string }).permissao, login: (token as { permissao?: string; login?: string }).login } } : null;
    logger.dev("🔍 Dados da sessão recebidos:", JSON.stringify(session, null, 2));
    
    if (!session?.user?.email) {
      logger.dev("🔒 Sessão inválida - sem email");
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: "Acesso negado. Sessão inválida."
      };
    }

    logger.dev("🔍 Verificando usuário no banco para:", session.user.email);
    
    // Verificar no banco se o usuário existe e suas permissões
    try {
      const client = await clientPromise;
      const db = client.db("paraiba");
      
      const user = await db.collection("users").findOne({ 
        email: session.user.email
      });
      
      if (!user) {
        logger.dev("❌ Usuário não encontrado no banco");
        return {
          isAuthenticated: false,
          isAdmin: false,
          error: "Acesso negado. Usuário não encontrado."
        };
      }
      
      const isAdmin = user.permissao === "administrador";
      logger.dev("👤 Usuário encontrado:", {
        email: user.email,
        permissao: user.permissao,
        nome: user.name,
        isAdmin
      });
      
      logger.dev("✅ Autenticação verificada com sucesso");
      logger.dev("🔍 === FIM DA VERIFICAÇÃO DE AUTENTICAÇÃO ===");
      
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
      logger.error("❌ Erro ao conectar com o banco de dados:", dbError);
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: "Erro interno na verificação de permissões."
      };
    }
  } catch (error) {
    logger.error("❌ Erro geral ao verificar autenticação:", error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: "Erro interno na verificação de permissões."
    };
  }
}