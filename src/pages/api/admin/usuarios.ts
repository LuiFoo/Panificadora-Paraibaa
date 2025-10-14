import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const db = client.db("paraiba");

    if (method === "GET") {
      // Buscar todos os usuários (ordem do mais antigo para o mais novo)
      const usuarios = await db.collection("users")
        .find({})
        .sort({ _id: 1 })
        .toArray();

      const usuariosFormatados = usuarios.map(user => ({
        id: user._id.toString(),
        login: user.login,
        name: user.name,
        email: user.email || "",
        telefone: user.telefone || "",
        permission: user.permissao || "usuario",
        dataCriacao: user.dataCriacao || null,
        ultimoAcesso: user.ultimoAcesso || null
      }));

      return res.status(200).json({ 
        success: true,
        usuarios: usuariosFormatados 
      });
    }

    if (method === "PUT") {
      // Atualizar permissão de usuário
      const { userId, permission } = req.body;

      if (!userId || !permission) {
        return res.status(400).json({ error: "userId e permission são obrigatórios" });
      }

      if (!["usuario", "administrador"].includes(permission)) {
        return res.status(400).json({ error: "Permissão inválida. Use 'usuario' ou 'administrador'" });
      }

      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId as string) },
        { 
          $set: { 
            permissao: permission,
            dataAtualizacao: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Permissão atualizada com sucesso" 
      });
    }

    if (method === "DELETE") {
      // Deletar usuário
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      const result = await db.collection("users").deleteOne({
        _id: new ObjectId(userId as string)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Usuário deletado com sucesso" 
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de usuários:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

