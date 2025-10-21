import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { googleId } = req.body;

    if (!googleId) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Google ID é obrigatório" 
      });
    }

    const client = await clientPromise;
    const db = client.db("paraiba");
    const users = db.collection("users");
    
    // Busca o usuário pelo Google ID
    const user = await users.findOne({ googleId });

    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        msg: "Usuário não encontrado" 
      });
    }

    // Atualiza último acesso
    await users.updateOne(
      { googleId },
      { $set: { ultimoAcesso: new Date() } }
    );

    return res.status(200).json({
      ok: true,
      user: {
        _id: user._id,
        login: user.login,
        name: user.name,
        email: user.email,
        permissao: user.permissao,
        googleId: user.googleId,
        picture: user.picture,
        dataCriacao: user.dataCriacao,
        ultimoAcesso: new Date(),
        permissaoSuprema: user.permissaoSuprema,
        ExIlimitada: user.ExIlimitada
      },
    });
  } catch (err) {
    console.error("ERRO GET USER DATA:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
