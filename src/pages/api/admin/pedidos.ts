import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    if (method === "GET") {
      // Buscar todos os pedidos
      const pedidos = await db.collection("pedidos")
        .find({})
        .sort({ dataPedido: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({ pedidos });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin pedidos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
