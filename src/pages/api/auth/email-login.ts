import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { email, password } = req.body;

    // 🐛 CORREÇÃO: Validações mais robustas
    if (!email || !password) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Email e senha são obrigatórios" 
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ 
        ok: false, 
        msg: "Dados inválidos" 
      });
    }

    if (email.length > 100 || password.length > 100) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Dados muito longos" 
      });
    }

    // Validação básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Formato de email inválido" 
      });
    }

    const client = await clientPromise;
    const db = client.db("paraiba");
    const users = db.collection("users");

    // Buscar usuário por email
    const user = await users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        ok: false, 
        msg: "Email ou senha incorretos" 
      });
    }

    // Verificar se o usuário tem senha definida (não é apenas Google Auth)
    if (user.password === 'google-auth') {
      return res.status(401).json({ 
        ok: false, 
        msg: "Esta conta usa login com Google. Use o botão 'Entrar com Google'." 
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        ok: false, 
        msg: "Email ou senha incorretos" 
      });
    }

    // Atualizar último acesso
    await users.updateOne(
      { _id: user._id },
      { $set: { ultimoAcesso: new Date() } }
    );

    return res.status(200).json({
      ok: true,
      msg: "Login realizado com sucesso",
      user: {
        _id: user._id,
        login: user.login,
        name: user.name,
        email: user.email,
        permissao: user.permissao,
        googleId: user.googleId,
        picture: user.picture,
        permissaoSuprema: user.permissaoSuprema,
        ExIlimitada: user.ExIlimitada
      }
    });

  } catch (err) {
    console.error("ERRO EMAIL LOGIN:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
