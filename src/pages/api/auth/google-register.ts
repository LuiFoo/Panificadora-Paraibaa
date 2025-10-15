import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { googleId, email, name, login, password } = req.body;

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (!googleId || !email || !name || !login || !password) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Todos os campos são obrigatórios" 
      });
    }

    // Validação do formato do login
    const loginRegex = /^[a-zA-Z0-9_]+$/;
    if (!loginRegex.test(login)) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Login inválido. Use apenas letras, números e _." 
      });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Verificar se já existe um usuário com este Google ID
    const existingGoogleUser = await users.findOne({ googleId });
    if (existingGoogleUser) {
      return res.status(200).json({ 
        ok: false, 
        msg: "Já existe uma conta associada a este Google" 
      });
    }

    // Verificar se o login já existe
    const existingLoginUser = await users.findOne({ login });
    if (existingLoginUser) {
      return res.status(200).json({ 
        ok: false, 
        msg: "Já existe um usuário com esse login" 
      });
    }

    // Verificar se o email já existe
    const existingEmailUser = await users.findOne({ email });
    if (existingEmailUser) {
      return res.status(200).json({ 
        ok: false, 
        msg: "Já existe um usuário com esse email" 
      });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const novoUser = {
      googleId,
      email,
      name,
      login,
      password: hashedPassword,
      permissao: "usuario",
      dataCriacao: new Date(),
      authProvider: "google"
    };

    const result = await users.insertOne(novoUser);

    // Gerar token JWT
    const token = jwt.sign(
      { _id: result.insertedId, login },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      ok: true,
      token,
      user: {
        _id: result.insertedId,
        login,
        name,
        email,
        permissao: "usuario",
        googleId
      },
    });
  } catch (err) {
    console.error("ERRO GOOGLE REGISTER:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
