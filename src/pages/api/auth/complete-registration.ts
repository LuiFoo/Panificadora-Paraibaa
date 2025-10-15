import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { googleId, password, name } = req.body;

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (!googleId || !password) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Google ID e senha são obrigatórios" 
      });
    }

    // Validação da senha
    if (password.length < 6) {
      return res.status(400).json({ 
        ok: false, 
        msg: "A senha deve ter pelo menos 6 caracteres" 
      });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Buscar usuário pelo Google ID
    const user = await users.findOne({ googleId });
    
    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        msg: "Usuário não encontrado" 
      });
    }

    // Verificar se já tem senha definida
    if (user.password !== 'google-auth') {
      return res.status(400).json({ 
        ok: false, 
        msg: "Este usuário já possui senha definida" 
      });
    }

    // Atualizar usuário com nova senha e nome (se fornecido)
    const updateData: any = {
      password: await bcrypt.hash(password, 10),
      ultimoAcesso: new Date()
    };

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    const result = await users.updateOne(
      { googleId },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ 
        ok: false, 
        msg: "Erro ao atualizar usuário" 
      });
    }

    // Buscar usuário atualizado
    const updatedUser = await users.findOne({ googleId });

    console.log("Cadastro completado com sucesso:", updatedUser?.email);

    return res.status(200).json({
      ok: true,
      msg: "Cadastro completado com sucesso",
      user: {
        _id: updatedUser?._id,
        login: updatedUser?.login,
        name: updatedUser?.name,
        email: updatedUser?.email,
        permissao: updatedUser?.permissao,
        googleId: updatedUser?.googleId,
        picture: updatedUser?.picture
      }
    });

  } catch (err) {
    console.error("ERRO COMPLETE REGISTRATION:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
