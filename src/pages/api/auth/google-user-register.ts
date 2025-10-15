import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { googleId, email, name, picture } = req.body;

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (!googleId || !email || !name) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Dados do Google incompletos" 
      });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Verificar se já existe um usuário com este Google ID
    const existingUser = await users.findOne({ googleId });
    if (existingUser) {
      console.log("Usuário já existe no MongoDB:", existingUser.email);
      return res.status(200).json({ 
        ok: true, 
        msg: "Usuário já existe",
        user: existingUser
      });
    }

    // Verificar se já existe um usuário com este email (segurança adicional)
    const existingEmailUser = await users.findOne({ email });
    if (existingEmailUser && existingEmailUser.googleId !== googleId) {
      console.log("Email já existe com outro Google ID:", email);
      return res.status(400).json({ 
        ok: false, 
        msg: "Este email já está associado a outra conta" 
      });
    }

    // Gerar login baseado no email
    const login = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Verificar se o login já existe (caso raro)
    let finalLogin = login;
    let counter = 1;
    while (await users.findOne({ login: finalLogin })) {
      finalLogin = `${login}${counter}`;
      counter++;
    }

    // Criar novo usuário
    const novoUser = {
      googleId,
      email,
      name,
      login: finalLogin,
      password: await bcrypt.hash('google-auth', 10), // Senha fictícia criptografada
      permissao: "usuario",
      dataCriacao: new Date(),
      authProvider: "google",
      picture: picture || null,
      ultimoAcesso: new Date()
    };

    console.log("Criando novo usuário no MongoDB:", { googleId, email, name, login: finalLogin });
    
    const result = await users.insertOne(novoUser);
    const userCreated = await users.findOne({ _id: result.insertedId });
    
    console.log("Usuário criado com sucesso:", userCreated.email);

    return res.status(200).json({
      ok: true,
      msg: "Usuário criado com sucesso",
      user: {
        _id: userCreated._id,
        login: userCreated.login,
        name: userCreated.name,
        email: userCreated.email,
        permissao: userCreated.permissao,
        googleId: userCreated.googleId,
        picture: userCreated.picture
      },
    });
  } catch (err) {
    console.error("ERRO GOOGLE USER REGISTER:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
