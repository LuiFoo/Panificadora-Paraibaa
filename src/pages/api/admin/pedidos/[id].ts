import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "ID do pedido é obrigatório" });
  }

  // Validar se o ID é um ObjectId válido
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID do pedido inválido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    if (method === "PUT") {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status é obrigatório" });
      }

      const statusValidos = ['pendente', 'confirmado', 'preparando', 'pronto', 'entregue', 'cancelado'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }

      const dataAtual = new Date();
      
      const updateDoc = {
        $set: { 
          status,
          ultimaAtualizacao: dataAtual
        },
        $push: {
          historico: {
            status,
            data: dataAtual
          }
        }
      };
      
      const result = await db.collection("pedidos").updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Status atualizado com sucesso"
      });
    }

    if (method === "GET") {
      const pedido = await db.collection("pedidos").findOne({ _id: new ObjectId(id) });

      if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      return res.status(200).json({ pedido });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin pedido:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
