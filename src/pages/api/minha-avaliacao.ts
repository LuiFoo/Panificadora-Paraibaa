import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { produtoId, userId } = req.query;

  if (!produtoId || !userId) {
    return res.status(400).json({ error: "produtoId e userId são obrigatórios" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");
    const avaliacoesCollection = db.collection("avaliacoes");

    const minhaAvaliacao = await avaliacoesCollection.findOne({
      produtoId: produtoId as string,
      userId: userId as string
    });

    if (!minhaAvaliacao) {
      return res.status(200).json({
        success: true,
        avaliacao: null
      });
    }

    return res.status(200).json({
      success: true,
      avaliacao: {
        nota: minhaAvaliacao.nota,
        dataCriacao: minhaAvaliacao.dataCriacao
      }
    });

  } catch (error) {
    console.error("Erro ao buscar avaliação:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}

