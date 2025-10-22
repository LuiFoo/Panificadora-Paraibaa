import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const client = await clientPromise;
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
        permissaoSuprema: user.permissaoSuprema === true || user.permissaoSuprema === "true" || user.ExIlimitada === true || user.ExIlimitada === "true",
        dataCriacao: user.dataCriacao || null,
        ultimoAcesso: user.ultimoAcesso || null,
        picture: user.picture || null,
        googleId: user.googleId || null
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

      if (typeof userId !== 'string' || typeof permission !== 'string') {
        return res.status(400).json({ error: "userId e permission devem ser strings válidas" });
      }

      // Verificar se quem está atualizando tem permissão suprema
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user || !session.user.email) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      // Buscar o usuário logado para verificar permissão suprema
      const adminUser = await db.collection("users").findOne({ 
        email: session.user.email 
      });

      if (!adminUser) {
        return res.status(404).json({ error: "Usuário administrador não encontrado" });
      }

      // VERIFICAÇÃO CRÍTICA: Apenas usuários com permissão suprema podem promover a admin
      // Verifica tanto permissaoSuprema quanto ExIlimitada (retrocompatibilidade)
      // Aceita boolean true ou string "true"
      const temPermissaoSuprema = 
        adminUser.permissaoSuprema === true || 
        adminUser.permissaoSuprema === "true" ||
        adminUser.ExIlimitada === true || 
        adminUser.ExIlimitada === "true";
      
      if (permission === "administrador" && !temPermissaoSuprema) {
        return res.status(403).json({ 
          error: "Apenas usuários com Permissão Suprema podem promover outros a administrador",
          requiredPermission: "permissaoSuprema"
        });
      }

      // Permitir apenas permissões válidas
      if (!["usuario", "administrador"].includes(permission)) {
        return res.status(400).json({ error: "Permissão inválida. Apenas 'usuario' ou 'administrador' são permitidos" });
      }

      // ✅ VALIDAR ObjectId antes de usar
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "ID de usuário inválido" });
      }

      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
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

      // Verificar se quem está deletando tem permissão suprema
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user || !session.user.email) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      // Buscar o usuário logado para verificar permissão suprema
      const adminUser = await db.collection("users").findOne({ 
        email: session.user.email 
      });

      if (!adminUser) {
        return res.status(404).json({ error: "Usuário administrador não encontrado" });
      }

      // VERIFICAÇÃO CRÍTICA: Apenas usuários com permissão suprema podem deletar usuários
      // Verifica tanto permissaoSuprema quanto ExIlimitada (retrocompatibilidade)
      // Aceita boolean true ou string "true"
      const temPermissaoSuprema = 
        adminUser.permissaoSuprema === true || 
        adminUser.permissaoSuprema === "true" ||
        adminUser.ExIlimitada === true || 
        adminUser.ExIlimitada === "true";
      
      if (!temPermissaoSuprema) {
        return res.status(403).json({ 
          error: "Apenas usuários com Permissão Suprema podem deletar usuários",
          requiredPermission: "permissaoSuprema"
        });
      }

      // ✅ VALIDAR ObjectId antes de usar
      if (!ObjectId.isValid(userId as string)) {
        return res.status(400).json({ error: "ID de usuário inválido" });
      }

      // 🛡️ PROTEÇÃO 1: Impedir que Super Admin delete a si mesmo
      if (adminUser._id.toString() === userId) {
        return res.status(403).json({ 
          error: "Você não pode deletar sua própria conta. Peça a outro Super Admin para fazer isso.",
          code: "CANNOT_DELETE_SELF"
        });
      }

      // 🛡️ PROTEÇÃO 2: Buscar o usuário a ser deletado para verificações adicionais
      const usuarioADeletar = await db.collection("users").findOne({
        _id: new ObjectId(userId as string)
      });

      if (!usuarioADeletar) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // 🛡️ PROTEÇÃO 3: Verificar se o usuário a ser deletado é Super Admin
      const targetTemPermissaoSuprema = 
        usuarioADeletar.permissaoSuprema === true || 
        usuarioADeletar.permissaoSuprema === "true" ||
        usuarioADeletar.ExIlimitada === true || 
        usuarioADeletar.ExIlimitada === "true";

      // Se está tentando deletar um Super Admin, verificar se não é o último
      if (targetTemPermissaoSuprema) {
        // Contar quantos Super Admins existem no sistema
        const totalSuperAdmins = await db.collection("users").countDocuments({
          $or: [
            { permissaoSuprema: true },
            { permissaoSuprema: "true" },
            { ExIlimitada: true },
            { ExIlimitada: "true" }
          ]
        });

        if (totalSuperAdmins <= 1) {
          return res.status(403).json({ 
            error: "Não é possível deletar o último Super Admin do sistema. Promova outro usuário a Super Admin primeiro.",
            code: "LAST_SUPER_ADMIN"
          });
        }
      }

      // Tudo OK, pode deletar
      const result = await db.collection("users").deleteOne({
        _id: new ObjectId(userId as string)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      console.log(`🗑️ Usuário deletado: ${usuarioADeletar.name} (${usuarioADeletar.email}) por ${adminUser.name} (${adminUser.email})`);

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

