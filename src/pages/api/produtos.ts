import type { NextApiRequest, NextApiResponse } from "next";
import client from "@/modules/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await client.connect();
    const db = client.db("paraiba");

    // Buscar produtos de todas as coleções
    const colecoes = [
      "bolos-doces-especiais",
      "doces-individuais", 
      "paes-doces",
      "paes-salgados-especiais",
      "roscas-paes-especiais",
      "salgados-assados-lanches",
      "sobremesas-tortas"
    ];

    const todosProdutos = [];

    for (const colecao of colecoes) {
      const produtos = await db.collection(colecao)
        .find({ 
          deleted: { $ne: true },
          status: { $ne: "pause" }
        })
        .toArray();
      
      todosProdutos.push(...produtos);
    }

    return res.status(200).json({
      produtos: todosProdutos,
      total: todosProdutos.length
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

