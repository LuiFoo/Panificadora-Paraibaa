import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "Slug do produto é obrigatório" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Buscar produto por slug
    const produto = await db.collection("produtos")
      .findOne({ 
        slug: slug,
        status: { $ne: "inativo" }
      });

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    return res.status(200).json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto por slug:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
