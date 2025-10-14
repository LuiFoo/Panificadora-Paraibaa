import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    await client.connect();
    const db = client.db("paraiba");
    const avaliacoesCollection = db.collection("avaliacoes");

    if (method === "GET") {
      // Buscar média de avaliações de um produto
      const { produtoId } = req.query;

      if (!produtoId) {
        return res.status(400).json({ error: "produtoId é obrigatório" });
      }

      const avaliacoes = await avaliacoesCollection
        .find({ produtoId: produtoId as string })
        .toArray();

      if (avaliacoes.length === 0) {
        return res.status(200).json({
          success: true,
          media: 0,
          total: 0
        });
      }

      const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
      const media = soma / avaliacoes.length;

      return res.status(200).json({
        success: true,
        media: Number(media.toFixed(1)),
        total: avaliacoes.length
      });
    }

    if (method === "POST") {
      // Criar nova avaliação
      const { produtoId, userId, nota } = req.body;

      if (!produtoId || !userId || !nota) {
        return res.status(400).json({ error: "produtoId, userId e nota são obrigatórios" });
      }

      if (nota < 1 || nota > 5) {
        return res.status(400).json({ error: "Nota deve ser entre 1 e 5" });
      }

      // Verificar se usuário já avaliou este produto
      const avaliacaoExistente = await avaliacoesCollection.findOne({
        produtoId,
        userId
      });

      if (avaliacaoExistente) {
        // Atualizar avaliação existente
        await avaliacoesCollection.updateOne(
          { produtoId, userId },
          {
            $set: {
              nota,
              dataAtualizacao: new Date()
            }
          }
        );

        return res.status(200).json({
          success: true,
          message: "Avaliação atualizada com sucesso"
        });
      }

      // Criar nova avaliação
      await avaliacoesCollection.insertOne({
        produtoId,
        userId,
        nota,
        dataCriacao: new Date()
      });

      return res.status(201).json({
        success: true,
        message: "Avaliação criada com sucesso"
      });
    }

    if (method === "DELETE") {
      // Remover avaliação
      const { produtoId, userId } = req.body;

      if (!produtoId || !userId) {
        return res.status(400).json({ error: "produtoId e userId são obrigatórios" });
      }

      await avaliacoesCollection.deleteOne({ produtoId, userId });

      return res.status(200).json({
        success: true,
        message: "Avaliação removida com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de avaliações:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

