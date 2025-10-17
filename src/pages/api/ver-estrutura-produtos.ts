import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Buscar um produto para ver a estrutura
    const produto = await db.collection("produtos").findOne({});
    
    return res.status(200).json({
      estrutura: produto,
      campos: produto ? Object.keys(produto) : [],
      message: "Estrutura do produto encontrado"
    });
  } catch (error) {
    console.error("Erro ao verificar estrutura:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
