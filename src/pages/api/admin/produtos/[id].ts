import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "ID do produto é obrigatório" });
  }

  // Validar se o ID é um ObjectId válido
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID do produto inválido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    if (method === "GET") {
      const produto = await db.collection("produtos").findOne({ _id: new ObjectId(id) });

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ produto });
    }

    if (method === "PUT") {
      const { subc, nome, valor, vtipo, ingredientes, img } = req.body;

      // Validações
      if (!subc || !nome || !valor || !vtipo || !ingredientes || !img) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      if (valor <= 0) {
        return res.status(400).json({ error: "Valor deve ser maior que zero" });
      }

      // Verificar se já existe outro produto com o mesmo nome
      const produtoExistente = await db.collection("produtos").findOne({ 
        nome, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (produtoExistente) {
        return res.status(400).json({ error: "Já existe outro produto com este nome" });
      }

      const result = await db.collection("produtos").updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            subc,
            nome,
            valor: parseFloat(valor),
            vtipo,
            ingredientes,
            img,
            dataAtualizacao: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto atualizado com sucesso"
      });
    }

    if (method === "DELETE") {
      const result = await db.collection("produtos").deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto excluído com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin produto:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
