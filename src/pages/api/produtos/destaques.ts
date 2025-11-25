import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Buscar produtos destacados - garantir que destaque seja exatamente true
    const produtos = await db.collection("produtos")
      .find({ 
        destaque: { $eq: true } // Buscar apenas onde destaque é exatamente true
      })
      .sort({ 
        atualizadoEm: -1, 
        criadoEm: -1 
      })
      .limit(20) // Limitar a 20 produtos destacados
      .toArray();
    

    // Formatar produtos para o frontend
    const produtosFormatados = produtos.map(produto => ({
      _id: produto._id.toString(),
      nome: produto.nome,
      slug: produto.slug || produto._id.toString(), // Fallback para slug
      imagem: produto.imagem || { 
        href: produto.img || '/images/placeholder.png', 
        alt: produto.nome || 'Produto' 
      },
      preco: produto.preco || { 
        valor: produto.valor || 0, 
        tipo: produto.vtipo || "UN" 
      },
      categoria: produto.categoria || { 
        nome: "", 
        slug: "" 
      },
      destaque: produto.destaque || false
    }));

    return res.status(200).json({ 
      success: true,
      produtos: produtosFormatados
    });

  } catch (error) {
    console.error("Erro ao buscar produtos destacados:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

