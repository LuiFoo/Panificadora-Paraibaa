import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import { ObjectId } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

interface Conversa {
  userId: string;
  userName: string;
  mensagens: unknown[];
  ultimaMensagem: string;
  naoLidas: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

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
          
          // Atualizar ultimaMensagem se esta mensagem for mais recente
          if (new Date(msg.dataEnvio) > new Date(conversas[userId].ultimaMensagem)) {
            conversas[userId].ultimaMensagem = msg.dataEnvio;
          }
          
          if (!msg.lida && msg.remetente === "cliente") {
            conversas[userId].naoLidas++;
          }
        });

        // Converter para array e ordenar por ultimaMensagem (mais recente primeiro)
        const conversasArray = Object.values(conversas);
        conversasArray.sort((a, b) => {
          return new Date(b.ultimaMensagem).getTime() - new Date(a.ultimaMensagem).getTime();
        });

        return res.status(200).json({ 
          success: true,
          conversas: conversasArray
        });
      }

      return res.status(200).json({ 
        success: true,
        mensagens 
      });
    }

    if (method === "POST") {
      const { userId, userName, mensagem, remetente } = req.body;
      
      // Validação mais robusta
      if (!userId || !userName || !mensagem || !remetente) {
        return res.status(400).json({ 
          error: "userId, userName, mensagem e remetente são obrigatórios" 
        });
      }

      if (typeof userId !== 'string' || typeof userName !== 'string' || typeof mensagem !== 'string' || typeof remetente !== 'string') {
        return res.status(400).json({ 
          error: "Todos os campos devem ser strings válidas" 
        });
      }

      if (mensagem.trim().length === 0) {
        return res.status(400).json({ 
          error: "Mensagem não pode estar vazia" 
        });
      }

      if (mensagem.length > 1000) {
        return res.status(400).json({ 
          error: "Mensagem muito longa (máximo 1000 caracteres)" 
        });
      }

      if (!['cliente', 'admin'].includes(remetente)) {
        return res.status(400).json({ 
          error: "Remetente deve ser 'cliente' ou 'admin'" 
        });
      }

      // Verificar se já existe uma mensagem idêntica nos últimos 2 segundos (evitar duplicatas)
      const agora = new Date();
      const doisSegundosAtras = new Date(agora.getTime() - 2000);
      
      const mensagemDuplicada = await mensagensCollection.findOne({
        userId,
        mensagem: mensagem.trim(),
        remetente,
        dataEnvio: { $gte: doisSegundosAtras }
      });

      if (mensagemDuplicada) {
        return res.status(409).json({ 
          error: "Mensagem duplicada detectada. Aguarde alguns segundos antes de enviar novamente." 
        });
      }

      const novaMensagem = {
        userId,
        userName,
        mensagem: mensagem.trim(),
        remetente, // "cliente" ou "admin"
        dataEnvio: agora,
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

