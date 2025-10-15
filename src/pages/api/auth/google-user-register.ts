import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { googleId, email, name, picture } = req.body;

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (!googleId || !email || !name) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Dados do Google incompletos" 
      });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Verificar se já existe um usuário com este Google ID
    const existingUser = await users.findOne({ googleId });
    if (existingUser) {
      console.log("Usuário já existe no MongoDB:", existingUser.email);
      return res.status(200).json({ 
        ok: true, 
        msg: "Usuário já existe",
        user: existingUser
      });
    }

    // Verificar se já existe um usuário com este email (segurança adicional)
    const existingEmailUser = await users.findOne({ email });
    if (existingEmailUser && existingEmailUser.googleId !== googleId) {
      console.log("Email já existe com outro Google ID:", email);
      return res.status(400).json({ 
        ok: false, 
        msg: "Este email já está associado a outra conta" 
      });
    }

    // Usuário não existe - não criar automaticamente
    // Deixar para o UnifiedAuthForm completar o cadastro
    console.log("Usuário novo detectado - aguardando completar cadastro:", email);
    return res.status(404).json({ 
      ok: false, 
      msg: "Usuário não encontrado - precisa completar cadastro" 
    });
  } catch (err) {
    console.error("ERRO GOOGLE USER REGISTER:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
