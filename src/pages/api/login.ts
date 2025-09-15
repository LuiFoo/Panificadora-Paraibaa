import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Login API chamada"); // log inicial

  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method);
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { login, password } = req.body;
    console.log("Recebido login:", login);

    if (!login || !password) {
      console.log("Login ou senha não fornecidos");
      return res.status(400).json({ ok: false, msg: "Login ou senha obrigatórios" });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    console.log("Procurando usuário no banco...");
    const user = await users.findOne({ login, password });

    if (!user) {
      console.log("Usuário não encontrado");
      return res.status(200).json({ ok: false, msg: "Login ou senha inválidos" });
    }

    console.log("Usuário encontrado:", user);
    // Retorna _id, login, name e permissao
    return res.status(200).json({
      ok: true,
      user: {
        _id: user._id,
        login: user.login,
        name: user.name,
        permissao: user.permissao, // administrador ou outro
      },
    });
  } catch (err) {
    console.error("ERRO LOGIN:", err);
    return res.status(500).json({ ok: false, msg: "Erro no servidor" });
  }
}
