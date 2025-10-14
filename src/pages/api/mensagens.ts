import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import { ObjectId } from "mongodb";

interface Conversa {
  userId: string;
  userName: string;
  mensagens: unknown[];
  ultimaMensagem: string;
  naoLidas: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const db = client.db("paraiba");
    const mensagensCollection = db.collection("mensagens");

    if (method === "GET") {
      const { userId, isAdmin } = req.query;

      let query = {};
      
      if (isAdmin === "true") {
        // Admin vê todas as conversas
        query = {};
      } else if (userId) {
        // Cliente vê apenas suas mensagens
        query = { userId: userId as string };
      } else {
        return res.status(400).json({ error: "userId ou isAdmin é obrigatório" });
      }

      const mensagens = await mensagensCollection
        .find(query)
        .sort({ dataEnvio: 1 })
        .toArray();

      // Agrupar mensagens por usuário (para o admin)
      if (isAdmin === "true") {
        const conversas: { [key: string]: Conversa } = {};
        
        mensagens.forEach((msg) => {
          const userId = msg.userId;
          if (!conversas[userId]) {
            conversas[userId] = {
              userId,
              userName: msg.userName,
              mensagens: [],
              ultimaMensagem: msg.dataEnvio,
              naoLidas: 0
            };
          }
          conversas[userId].mensagens.push(msg);
          if (!msg.lida && msg.remetente === "cliente") {
            conversas[userId].naoLidas++;
          }
        });

        return res.status(200).json({ 
          success: true,
          conversas: Object.values(conversas)
        });
      }

      return res.status(200).json({ 
        success: true,
        mensagens 
      });
    }

    if (method === "POST") {
      const { userId, userName, mensagem, remetente } = req.body;

      if (!userId || !userName || !mensagem || !remetente) {
        return res.status(400).json({ 
          error: "userId, userName, mensagem e remetente são obrigatórios" 
        });
      }

      const novaMensagem = {
        userId,
        userName,
        mensagem,
        remetente, // "cliente" ou "admin"
        dataEnvio: new Date(),
        lida: false
      };

      const result = await mensagensCollection.insertOne(novaMensagem);

      return res.status(200).json({ 
        success: true,
        mensagemId: result.insertedId,
        mensagem: novaMensagem
      });
    }

    if (method === "PUT") {
      // Marcar mensagens como lidas
      const { userId, marcarComoLida, isAdmin } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      if (marcarComoLida) {
        // Se for admin, marca mensagens do cliente como lidas
        // Se for cliente, marca mensagens do admin como lidas
        const remetente = isAdmin ? "cliente" : "admin";
        
        await mensagensCollection.updateMany(
          { 
            userId, 
            remetente,
            lida: false 
          },
          { 
            $set: { lida: true } 
          }
        );
      }

      return res.status(200).json({ 
        success: true,
        message: "Mensagens marcadas como lidas" 
      });
    }

    if (method === "DELETE") {
      const { mensagemId, userId } = req.query;

      // Deletar conversa inteira (todas as mensagens de um usuário)
      if (userId) {
        const result = await mensagensCollection.deleteMany({
          userId: userId as string
        });

        return res.status(200).json({ 
          success: true,
          message: `Conversa deletada com sucesso (${result.deletedCount} mensagens removidas)` 
        });
      }

      // Deletar mensagem individual
      if (mensagemId) {
        await mensagensCollection.deleteOne({
          _id: new ObjectId(mensagemId as string)
        });

        return res.status(200).json({ 
          success: true,
          message: "Mensagem deletada com sucesso" 
        });
      }

      return res.status(400).json({ error: "mensagemId ou userId é obrigatório" });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de mensagens:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

