import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // 1. Contar pedidos de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const pedidosHoje = await db.collection("pedidos")
      .countDocuments({
        dataPedido: {
          $gte: hoje,
          $lt: amanha
        }
      });

    // 2. Contar total de usuários
    const totalUsuarios = await db.collection("usuarios").countDocuments({});

    // 3. Contar total de produtos (da coleção unificada produtos)
    const totalProdutos = await db.collection("produtos").countDocuments({});

    // 4. Contar produtos das coleções antigas
    const colecoes = [
      "bolos-doces-especiais",
      "doces-individuais",
      "paes-doces",
      "paes-salgados-especiais",
      "roscas-paes-especiais",
      "salgados-assados-lanches",
      "sobremesas-tortas"
    ];

    let produtosAntigos = 0;
    for (const colecao of colecoes) {
      const count = await db.collection(colecao).countDocuments({ 
        deleted: { $ne: true } 
      });
      produtosAntigos += count;
    }

    const totalProdutosCombinado = totalProdutos + produtosAntigos;

    // 5. Estatísticas de pedidos por status
    const pedidosPorStatus = await db.collection("pedidos")
      .aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 }
          }
        }
      ])
      .toArray();

    const statusMap = {
      pendente: 0,
      confirmado: 0,
      cancelado: 0,
      entregue: 0
    };

    pedidosPorStatus.forEach((item: { _id: string; total: number }) => {
      if (item._id in statusMap) {
        statusMap[item._id as keyof typeof statusMap] = item.total;
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        pedidosHoje,
        totalUsuarios,
        totalProdutos: totalProdutosCombinado,
        pedidosPorStatus: statusMap
      }
    });

  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

