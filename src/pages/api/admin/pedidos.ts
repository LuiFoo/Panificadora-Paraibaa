import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    if (method === "GET") {
      // Buscar todos os pedidos com informações do usuário
      const pedidos = await db.collection("pedidos")
        .find({})
        .sort({ dataPedido: -1 })
        .limit(100)
        .toArray();

      // Enriquecer pedidos com informações do usuário
      const pedidosEnriquecidos = await Promise.all(
        pedidos.map(async (pedido) => {
          const usuario = await db.collection("users").findOne({ 
            email: pedido.emailUsuario || pedido.userEmail 
          });
          
          return {
            ...pedido,
            usuario: usuario ? {
              nome: usuario.name,
              email: usuario.email,
              telefone: usuario.phone
            } : null
          };
        })
      );

      return res.status(200).json({ success: true, pedidos: pedidosEnriquecidos });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin pedidos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
