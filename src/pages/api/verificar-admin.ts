import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Verificar-admin API chamada");
  
  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method);
    return res.status(405).json({ msg: "Método não permitido" });
  }

  const { login, password } = req.body;
  console.log("Dados recebidos:", { login, hasPassword: !!password });

  if (!login || !password) {
    console.log("Faltando login ou senha");
    return res.status(400).json({ ok: false, msg: "Faltando login ou senha" });
  }

  try {
    console.log("Conectando ao MongoDB...");
    
    // Tenta conectar ao MongoDB
    try {
      await client.connect();
      console.log("Conexão com MongoDB estabelecida");
    } catch (connectErr) {
      console.error("Erro ao conectar com MongoDB:", connectErr);
      return res.status(500).json({ ok: false, msg: "Erro de conexão com o banco de dados" });
    }
    
    const db = client.db("paraiba");
    const users = db.collection("users");

    console.log("Buscando usuário:", login);
    // Busca o usuário pelo login
    const user = await users.findOne({ login });

    if (!user) {
      console.log("Usuário não encontrado");
      return res.status(401).json({ ok: false, msg: "Usuário ou senha inválidos" });
    }

    console.log("Usuário encontrado, verificando senha...");
    // Verifica a senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Senha inválida");
      return res.status(401).json({ ok: false, msg: "Usuário ou senha inválidos" });
    }

    console.log("Usuário validado com sucesso");
    // Retorna o usuário válido (não precisa ser admin para login normal)
    return res.status(200).json({ 
      ok: true, 
      user: {
        _id: user._id,
        login: user.login,
        name: user.name,
        permissao: user.permissao
      }
    });
  } catch (err) {
    console.error("Erro na API verificar-admin:", err);
    return res.status(500).json({ ok: false, msg: "Erro no servidor: " + err.message });
  }
}
