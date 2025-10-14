import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs"; // Biblioteca para hash de senha
import jwt from "jsonwebtoken"; // Biblioteca para gerar tokens JWT

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; // Chave secreta para JWT

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { login, password, name } = req.body;

    // Validação dos dados de entrada
    if (!login || !password || !name) {
      return res.status(400).json({ ok: false, msg: "Todos os campos são obrigatórios" });
    }

    // Verificação simples para o formato do login (exemplo: não permitir caracteres especiais)
    const loginRegex = /^[a-zA-Z0-9_]+$/;
    if (!loginRegex.test(login)) {
      return res.status(400).json({ ok: false, msg: "Login inválido. Use apenas letras, números e _." });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Verificar se o login já existe
    const existe = await users.findOne({ login });
    if (existe) {
      return res.status(200).json({ ok: false, msg: "Já existe um usuário com esse login" });
    }

    // Criptografar a senha antes de armazená-la
    const hashedPassword = await bcrypt.hash(password, 10);

    // Define permissao padrão como "usuario"
    const novoUser = { 
      login, 
      password: hashedPassword, 
      name, 
      permissao: "usuario",
      dataCriacao: new Date()
    };

    const result = await users.insertOne(novoUser);

    // Gerar o token JWT para o usuário
    const token = jwt.sign(
      { _id: result.insertedId, login },
      JWT_SECRET,
      { expiresIn: "1h" } // Expiração do token em 1 hora
    );

    // Retorna o usuário completo, incluindo _id, permissao e token
    return res.status(200).json({
      ok: true,
      msg: "Usuário cadastrado com sucesso",
      token,
      user: {
        _id: result.insertedId.toString(),
        login,
        name,
        permissao: novoUser.permissao,
      },
    });
  } catch (err) {
    console.error("ERRO REGISTER:", err);
    return res.status(500).json({ ok: false, msg: "Erro no servidor" });
  }
}
