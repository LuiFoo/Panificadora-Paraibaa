import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const db = client.db("paraiba");
    const users = db.collection("users");

    // Busca todos os usuários
    const allUsers = await users.find({}).toArray();

    console.log(`Total de usuários no MongoDB: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`- ${user.email} (Google ID: ${user.googleId}) - Criado: ${user.dataCriacao}`);
    });

    return res.status(200).json({
      ok: true,
      total: allUsers.length,
      users: allUsers.map(user => ({
        _id: user._id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        login: user.login,
        dataCriacao: user.dataCriacao,
        ultimoAcesso: user.ultimoAcesso
      }))
    });
  } catch (err) {
    console.error("ERRO DEBUG USERS:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
