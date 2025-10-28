import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("🔍 === API BUSCAR USUÁRIOS ===");
  console.log("📝 Método:", req.method);
  console.log("🔗 URL:", req.url);
  console.log("📋 Query params:", req.query);

  if (req.method !== "GET") {
    console.log("❌ Método não permitido");
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Verificar se o usuário é admin
  console.log("🔐 Verificando permissões de admin...");
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    console.log("❌ Usuário não é admin:", error);
    return res.status(403).json({ error });
  }
  console.log("✅ Usuário é admin");

  try {
    const { q } = req.query;
    console.log("🔍 Query recebida:", q);

    if (!q || typeof q !== "string") {
      console.log("❌ Parâmetro 'q' é obrigatório");
      return res.status(400).json({ error: "Parâmetro 'q' é obrigatório" });
    }

    // ✅ PROTEÇÃO CRÍTICA: Escapar caracteres especiais de regex para prevenir ReDoS/NoSQL injection
    // Limitar tamanho para prevenir ataques
    if (q.length > 50) {
      console.log("❌ Busca muito longa:", q.length);
      return res.status(400).json({ error: "Busca muito longa (máximo 50 caracteres)" });
    }

    // Escapar todos os caracteres especiais de regex
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    console.log("🔍 Query escapada:", escapedQuery);

    const client = await clientPromise;
    const db = client.db("paraiba");
    const usuariosCollection = db.collection("users");

    console.log("🗄️ Executando busca no MongoDB...");
    
    // Contar total de usuários no banco
    const totalUsuarios = await usuariosCollection.countDocuments();
    console.log("📊 Total de usuários no banco:", totalUsuarios);
    
    // Buscar usuários que não são admin
    const usuarios = await usuariosCollection
      .find({
        $and: [
          {
            $or: [
              { login: { $regex: escapedQuery, $options: "i" } },
              { name: { $regex: escapedQuery, $options: "i" } }
            ]
          },
          { permissao: { $ne: "administrador" } } // Excluir administradores
        ]
      })
      .limit(10)
      .project({ _id: 1, login: 1, name: 1 })
      .toArray();

    console.log("📊 Usuários encontrados:", usuarios.length);
    console.log("👥 Dados dos usuários:", JSON.stringify(usuarios, null, 2));
    
    // Debug: Mostrar todos os usuários no banco (apenas em desenvolvimento)
    if (usuarios.length === 0 && process.env.NODE_ENV === 'development') {
      console.log("⚠️ Nenhum usuário encontrado com essa busca. Mostrando todos os usuários do banco:");
      const todosUsuarios = await usuariosCollection.find({}).project({ _id: 1, login: 1, name: 1, permissao: 1 }).limit(20).toArray();
      console.log("👥 Todos os usuários:", JSON.stringify(todosUsuarios, null, 2));
    }

    return res.status(200).json({
      success: true,
      usuarios
    });

  } catch (error) {
    console.error("❌ Erro ao buscar usuários:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

