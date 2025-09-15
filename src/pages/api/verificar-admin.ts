import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ msg: "Faltando login ou senha" });
  }

  try {
    await client.connect();
    const db = client.db("paraiba"); // coloque o nome do seu banco
    const users = db.collection("users");

    const user = await users.findOne({ login, password });

    if (!user) {
      return res.status(401).json({ msg: "Usuário ou senha inválidos" });
    }

    if (user.permissao !== "administrador") {
      return res.status(403).json({ msg: "Sem permissão" });
    }

    return res.status(200).json({ msg: "ok", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Erro no servidor" });
  }
}
