import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const db = client.db("paraiba");
    const usersCollection = db.collection("users");

    if (method === "GET") {
      // Buscar dados salvos do usuário
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      const user = await usersCollection.findOne({ login: userId as string });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.status(200).json({
        success: true,
        dadosSalvos: {
          telefone: user.telefone || "",
          endereco: user.endereco || null
        }
      });
    }

    if (method === "PUT") {
      // Salvar dados do usuário
      const { userId, telefone, endereco } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      const updateData: {
        dataAtualizacao: Date;
        telefone?: string;
        endereco?: string;
      } = {
        dataAtualizacao: new Date()
      };

      if (telefone) {
        updateData.telefone = telefone;
      }

      if (endereco) {
        updateData.endereco = endereco;
      }

      const result = await usersCollection.updateOne(
        { login: userId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Dados salvos com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de dados do usuário:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

