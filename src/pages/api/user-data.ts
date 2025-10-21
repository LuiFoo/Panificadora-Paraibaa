import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO OBRIGATÓRIA
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const sessionLogin = (session.user as { login?: string }).login || session.user.id;

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");
    const usersCollection = db.collection("users");

    if (method === "GET") {
      // Buscar dados salvos do usuário
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      // ✅ VERIFICAR SE O USUÁRIO ESTÁ BUSCANDO SEUS PRÓPRIOS DADOS
      if (userId !== sessionLogin) {
        return res.status(403).json({ 
          error: "Você só pode visualizar seus próprios dados" 
        });
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

      // ✅ VERIFICAR SE O USUÁRIO ESTÁ ATUALIZANDO SEUS PRÓPRIOS DADOS
      if (userId !== sessionLogin) {
        return res.status(403).json({ 
          error: "Você só pode atualizar seus próprios dados" 
        });
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

