import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId, Db } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

// Função para buscar produto na coleção unificada
async function buscarProduto(db: Db, id: string) {
  const produto = await db.collection("produtos").findOne({ _id: new ObjectId(id) });
  return { produto, colecao: "produtos" };
}

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
    const { status } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID do produto é obrigatório" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID do produto inválido" });
    }

    if (!status || !["active", "pause"].includes(status)) {
      return res.status(400).json({ error: "Status deve ser 'active' ou 'pause'" });
    }

    const client = await clientPromise;
    const db = client.db("paraiba");

    // Verificar se o produto existe
    const { produto } = await buscarProduto(db, id);
    
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Atualizar o status na coleção unificada
    const result = await db.collection("produtos").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          atualizadoEm: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    return res.status(200).json({ 
      success: true,
      message: `Produto ${status === "active" ? "ativado" : "pausado"} com sucesso`,
      status
    });

  } catch (error) {
    console.error("Erro ao alterar status do produto:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
