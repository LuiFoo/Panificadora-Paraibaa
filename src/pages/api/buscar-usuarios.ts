import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Parâmetro 'q' é obrigatório" });
    }

    // ✅ PROTEÇÃO CRÍTICA: Escapar caracteres especiais de regex para prevenir ReDoS/NoSQL injection
    // Limitar tamanho para prevenir ataques
    if (q.length > 50) {
      return res.status(400).json({ error: "Busca muito longa (máximo 50 caracteres)" });
    }

    // Escapar todos os caracteres especiais de regex
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const client = await clientPromise;
    const db = client.db("paraiba");
    const usuariosCollection = db.collection("users");
    
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

