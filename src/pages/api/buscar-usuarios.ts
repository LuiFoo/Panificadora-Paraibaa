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

    const client = await clientPromise;
    const db = client.db("paraiba");
    const usuariosCollection = db.collection("users");

    // Buscar usuários que não são admin
    const usuarios = await usuariosCollection
      .find({
        $or: [
          { login: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } }
        ],
        permissao: { $ne: "administrador" } // Excluir administradores
      })
      .limit(10)
      .project({ _id: 1, login: 1, name: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      usuarios
    });

  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

