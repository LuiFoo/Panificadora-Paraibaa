import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Método não permitido" });
  }

  try {
    const { email, newPassword } = req.body;

    // Verifica se todos os campos obrigatórios foram fornecidos
    if (!email || !newPassword) {
      return res.status(400).json({ 
        ok: false, 
        msg: "Email e nova senha são obrigatórios" 
      });
    }

    // Validação da senha
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        ok: false, 
        msg: "A senha deve ter pelo menos 6 caracteres" 
      });
    }

    const db = client.db("paraiba");
    const users = db.collection("users");

    // Buscar usuário pelo email
    const user = await users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        msg: "Usuário não encontrado" 
      });
    }

    // Verificar se o usuário tem senha definida (não é apenas Google Auth)
    if (user.password === 'google-auth') {
      return res.status(400).json({ 
        ok: false, 
        msg: "Esta conta usa login com Google. Use o botão 'Entrar com Google'." 
      });
    }

    // Atualizar senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await users.updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          password: hashedPassword,
          ultimoAcesso: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ 
        ok: false, 
        msg: "Erro ao atualizar senha" 
      });
    }

    console.log("Senha redefinida com sucesso:", user.email);

    return res.status(200).json({
      ok: true,
      msg: "Senha redefinida com sucesso"
    });

  } catch (err) {
    console.error("ERRO RESET PASSWORD:", err);
    return res.status(500).json({ 
      ok: false, 
      msg: "Erro interno no servidor" 
    });
  }
}
