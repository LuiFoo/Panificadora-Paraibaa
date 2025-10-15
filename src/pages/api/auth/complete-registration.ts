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
      // Se usuário não existe, criar novo usuário
      console.log("Criando novo usuário para Google ID:", googleId);
      
      // Gerar login baseado no email (se disponível) ou nome
      const login = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : `user${Date.now()}`;
      
      // Verificar se o login já existe
      let finalLogin = login;
      let counter = 1;
      while (await users.findOne({ login: finalLogin })) {
        finalLogin = `${login}${counter}`;
        counter++;
      }

      const newUser = {
        googleId,
        email: '', // Será preenchido quando o usuário fizer login novamente
        name: name || '',
        login: finalLogin,
        password: await bcrypt.hash(password, 10),
        permissao: "usuario",
        dataCriacao: new Date(),
        authProvider: "google",
        picture: null,
        ultimoAcesso: new Date()
      };

      const result = await users.insertOne(newUser);
      const createdUser = await users.findOne({ _id: result.insertedId });

      return res.status(200).json({
        ok: true,
        msg: "Usuário criado com sucesso",
        user: createdUser ? {
          _id: createdUser._id,
          login: createdUser.login,
          name: createdUser.name,
          email: createdUser.email,
          permissao: createdUser.permissao,
          googleId: createdUser.googleId,
          picture: createdUser.picture
        } : null,
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
    const updateData: {
      password: string;
      ultimoAcesso: Date;
      name?: string;
    } = {
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
