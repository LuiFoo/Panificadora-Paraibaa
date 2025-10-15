import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Email é obrigatório" 
      });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    console.log("Buscando perfil do usuário:", email);
    
    // Busca o usuário pelo email
    const user = await users.findOne({ email });

    if (!user) {
      console.log("Usuário não encontrado para email:", email);
      return res.status(404).json({ 
        ok: false, 
        msg: "Usuário não encontrado" 
      });
    }

    console.log("Usuário encontrado:", user.email);

    return res.status(200).json({
      ok: true,
      profile: {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        birthDate: user.birthDate || "",
        gender: user.gender || "",
        preferences: user.preferences || {
          notifications: true,
          newsletter: false,
          promotions: false,
        },
        permissao: user.permissao || "usuario",
        googleId: user.googleId || "",
        picture: user.picture || null,
        dataCriacao: user.dataCriacao,
        ultimaAtualizacao: user.ultimaAtualizacao,
      },
    });
  } catch (err) {
    console.error("ERRO GET PROFILE:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
