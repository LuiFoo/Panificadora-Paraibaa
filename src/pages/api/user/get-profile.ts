import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    let email: string | undefined;
    let userId: string | undefined;

    if (req.method === "POST") {
      email = req.body.email;
      // POST é para usuário buscar seu próprio perfil
    } else if (req.method === "GET") {
      userId = req.query.userId as string;
      // GET é para admin buscar perfil de outros usuários - precisa verificar admin
      const { isAdmin, error } = await protegerApiAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ 
          ok: false, 
          msg: error 
        });
      }
    }

    if (!email && !userId) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Email ou userId é obrigatório" 
      });
    }

    const client = await clientPromise;
    const db = client.db("paraiba");
    const users = db.collection("users");

    let user;
    if (email) {
      console.log("Buscando perfil do usuário por email:", email);
      user = await users.findOne({ email });
    } else if (userId) {
      console.log("Buscando perfil do usuário por userId:", userId);
      user = await users.findOne({ login: userId });
    }

    if (!user) {
      console.log("Usuário não encontrado para:", email || userId);
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
        endereco: user.endereco || {
          rua: user.address || "",
          numero: user.number || "",
          bairro: user.neighborhood || "",
          cidade: user.city || "",
          estado: user.state || "",
          cep: user.zipCode || "",
        },
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
