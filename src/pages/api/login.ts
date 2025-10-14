import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs"; // Biblioteca para hash de senha
import jwt from "jsonwebtoken"; // Biblioteca para gerar tokens JWT

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; // Chave secreta para JWT

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verifica se o método da requisição é POST
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { login, password } = req.body;

    // Verifica se login e senha foram fornecidos
    if (!login || !password) {
      return res.status(400).json({ ok: false, msg: "Login e senha são obrigatórios" });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Busca o usuário no banco de dados
    const user = await users.findOne({ login });

    if (!user) {
      return res.status(200).json({ ok: false, msg: "Login ou senha inválidos" });
    }

    // Verifica se a senha é válida usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(200).json({ ok: false, msg: "Login ou senha inválidos" });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { _id: user._id, login: user.login },
      JWT_SECRET,
      { expiresIn: "1h" } // Expiração do token em 1 hora
    );

    // Retorna o token e os dados do usuário
    return res.status(200).json({
      ok: true,
      token,
      user: {
        _id: user._id,
        login: user.login,
        name: user.name,
        permissao: user.permissao, // administrador ou outro
      },
    });
  } catch (err) {
    console.error("ERRO LOGIN:", err);
    return res.status(500).json({ ok: false, msg: "Erro interno no servidor" });
  }
}
