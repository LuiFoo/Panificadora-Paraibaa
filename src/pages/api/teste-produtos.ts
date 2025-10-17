import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Contar produtos na coleção
    const totalProdutos = await db.collection("produtos").countDocuments();
    
    // Buscar alguns produtos para mostrar
    const produtos = await db.collection("produtos")
      .find({})
      .limit(5)
      .toArray();

    return res.status(200).json({
      total: totalProdutos,
      produtos: produtos,
      message: "Produtos encontrados na coleção unificada"
    });
  } catch (error) {
    console.error("Erro ao testar produtos:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
