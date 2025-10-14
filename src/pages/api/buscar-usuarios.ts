import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { search } = req.query;

    if (!search || typeof search !== "string") {
      return res.status(400).json({ error: "Parâmetro 'search' é obrigatório" });
    }

    const db = client.db("paraiba");
    const usuariosCollection = db.collection("users");

    // Buscar usuários que não são admin
    const usuarios = await usuariosCollection
      .find({
        $or: [
          { login: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } }
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

