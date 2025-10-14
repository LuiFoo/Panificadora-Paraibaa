import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ ok: false, msg: "Login e senha são obrigatórios" });
  }

  try {
    await client.connect();
    const db = client.db("paraiba");
    const users = db.collection("users");

    // Busca o usuário pelo login
    const user = await users.findOne({ login });

    if (!user) {
      return res.status(401).json({ ok: false, msg: "Usuário não encontrado" });
    }

    // Verifica a senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ ok: false, msg: "Senha inválida" });
    }

    // Verifica se é administrador
    const isAdmin = user.permissao === "administrador";

    return res.status(200).json({ 
      ok: true, 
      isAdmin,
      user: {
        _id: user._id,
        login: user.login,
        name: user.name,
        permissao: user.permissao
      }
    });
  } catch (err) {
    console.error("Erro na verificação de admin:", err);
    return res.status(500).json({ ok: false, msg: "Erro no servidor" });
  }
}



