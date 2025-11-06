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

    // Normalizar produtos para garantir estrutura consistente
    const produtosFormatados = produtos.map(produto => ({
      ...produto,
      _id: produto._id.toString(),
      // Garantir que imagem existe e tem a estrutura correta
      imagem: produto.imagem || {
        href: produto.img || '/images/placeholder.png',
        alt: produto.nome || 'Produto'
      },
      // Manter compatibilidade com produtos antigos
      img: produto.img || produto.imagem?.href || '/images/placeholder.png',
      // Normalizar preço
      preco: produto.preco || {
        valor: produto.valor || 0,
        tipo: produto.vtipo || "UN"
      },
      // Normalizar categoria
      categoria: produto.categoria || {
        nome: "",
        slug: ""
      },
      // Garantir arrays - sempre retornar array (mesmo vazio) quando campo não existe ou é null/undefined
      ingredientes: produto.ingredientes === null || produto.ingredientes === undefined
        ? []
        : (Array.isArray(produto.ingredientes) 
          ? produto.ingredientes 
          : (typeof produto.ingredientes === 'string' && produto.ingredientes.trim() 
            ? produto.ingredientes.split(',').map((i: string) => i.trim()).filter(Boolean)
            : [])),
      alergicos: produto.alergicos === null || produto.alergicos === undefined
        ? []
        : (Array.isArray(produto.alergicos) 
          ? produto.alergicos 
          : (typeof produto.alergicos === 'string' && produto.alergicos.trim() 
            ? produto.alergicos.split(',').map((a: string) => a.trim()).filter(Boolean)
            : [])),
      tags: produto.tags === null || produto.tags === undefined
        ? []
        : (Array.isArray(produto.tags) 
          ? produto.tags 
          : (typeof produto.tags === 'string' && produto.tags.trim() 
            ? produto.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
            : []))
    }));

    return res.status(200).json({
      categoria: slug,
      produtos: produtosFormatados,
      total: produtosFormatados.length
    });
  } catch (error) {
    console.error("Erro ao buscar produtos por categoria:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
