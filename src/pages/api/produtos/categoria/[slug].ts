import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "Slug da categoria é obrigatório" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Buscar produtos por categoria
    const produtos = await db.collection("produtos")
      .find({ 
        "categoria.slug": slug,
        status: { $ne: "inativo" }
      })
      .sort({ 
        destaque: -1,
        criadoEm: -1 
      })
      .toArray();

    return res.status(200).json({
      categoria: slug,
      produtos,
      total: produtos.length
    });
  } catch (error) {
    console.error("Erro ao buscar produtos por categoria:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
