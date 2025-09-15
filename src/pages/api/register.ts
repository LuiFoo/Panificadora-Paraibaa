import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Register API chamada");

  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method);
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { login, password, name } = req.body;
    console.log("Recebido registro:", login, name);

    if (!login || !password || !name) {
      console.log("Dados incompletos para registro");
      return res.status(400).json({ ok: false, msg: "Todos os campos são obrigatórios" });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    const existe = await users.findOne({ login });
    if (existe) {
      console.log("Usuário já existe:", login);
      return res.status(200).json({ ok: false, msg: "Já existe" });
    }

    // Define permissao padrão como "usuario"
    const novoUser = { login, password, name, permissao: "usuario" };

    const result = await users.insertOne(novoUser);
    console.log("Usuário registrado com sucesso:", login);

    // Retorna o usuário completo, incluindo _id e permissao
    return res.status(200).json({
      ok: true,
      msg: "Usuário cadastrado com sucesso",
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
