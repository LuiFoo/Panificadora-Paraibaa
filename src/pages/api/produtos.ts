import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db("paraiba");
    const { ids } = req.query;

    // Se vier lista de IDs, retornar produtos específicos (com projection reduzida)
    if (ids) {
      const idList = String(ids).split(',').filter(Boolean);
      const objectIds = idList
        .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : null))
        .filter((id): id is ObjectId => !!id);

      const produtos = await db.collection("produtos")
        .find({ _id: { $in: objectIds } }, {
          projection: {
            _id: 1,
            nome: 1,
            status: 1,
            "preco.valor": 1,
            "preco.tipo": 1,
            "imagem.href": 1
          }
        })
        .toArray();

      return res.status(200).json({ produtos, total: produtos.length });
    }

    // Buscar todos os produtos ativos da coleção unificada
    const produtos = await db.collection("produtos")
      .find({ status: { $ne: "inativo" } }, {
        projection: {
          _id: 1,
          nome: 1,
          slug: 1,
          descricao: 1,
          categoria: 1,
          subcategoria: 1,
          preco: 1,
          estoque: 1,
          imagem: 1,
          destaque: 1,
          tags: 1,
          status: 1,
          criadoEm: 1
        }
      })
      .sort({ destaque: -1, criadoEm: -1 })
      .toArray();

    return res.status(200).json({ produtos, total: produtos.length });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

