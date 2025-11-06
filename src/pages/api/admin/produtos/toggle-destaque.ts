import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID do produto é obrigatório" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID do produto inválido" });
    }

    const client = await clientPromise;
    const db = client.db("paraiba");

    // Buscar o produto atual
    const produto = await db.collection("produtos").findOne({ _id: new ObjectId(id) });
    
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Alternar o valor de destaque (tratar caso onde campo não existe)
    const novoDestaque = !(produto.destaque === true);

    // Atualizar o destaque na coleção
    const result = await db.collection("produtos").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          destaque: novoDestaque,
          atualizadoEm: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    return res.status(200).json({ 
      success: true,
      message: `Produto ${novoDestaque ? "marcado como" : "removido dos"} destaques com sucesso`,
      destaque: novoDestaque
    });

  } catch (error) {
    console.error("Erro ao alterar destaque do produto:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

