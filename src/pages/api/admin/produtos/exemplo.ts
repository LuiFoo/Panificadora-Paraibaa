import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Produto de exemplo baseado na estrutura fornecida
    const produtoExemplo = {
      subc: "PAES DOCES",
      nome: "Calabresa",
      valor: 5,
      vtipo: "UN",
      ingredientes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse i…",
      img: "https://i.imgur.com/EeDC5xQ.png",
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };

    const result = await db.collection("produtos").insertOne(produtoExemplo);

    return res.status(201).json({ 
      success: true,
      message: "Produto de exemplo criado com sucesso!",
      produtoId: result.insertedId
    });

  } catch (error) {
    console.error("Erro ao criar produto de exemplo:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

