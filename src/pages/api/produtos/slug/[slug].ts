import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Definir headers JSON explicitamente
  res.setHeader('Content-Type', 'application/json');

  // Apenas permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "ID do produto é obrigatório" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Validar se é um ObjectId válido
    if (!ObjectId.isValid(slug)) {
      console.log(`Parâmetro inválido (não é ObjectId): ${slug}`);
      return res.status(400).json({ error: "ID do produto inválido" });
    }

    // Buscar produto por ID
    const produto = await db.collection("produtos")
      .findOne({ 
        _id: new ObjectId(slug)
      });

    if (!produto) {
      console.log(`Produto não encontrado para ID: ${slug}`);
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Converter _id para string e normalizar estrutura de dados
    const produtoFormatado = {
      ...produto,
      _id: produto._id.toString(),
      // Garantir que imagem existe e tem a estrutura correta
      imagem: produto.imagem ? {
        href: produto.imagem.href || produto.img || '/images/placeholder.png',
        alt: produto.imagem.alt || produto.nome || 'Produto',
        galeria: Array.isArray(produto.imagem.galeria) ? produto.imagem.galeria : []
      } : {
        href: produto.img || '/images/placeholder.png',
        alt: produto.nome || 'Produto',
        galeria: []
      },
      // Manter compatibilidade com produtos antigos
      img: produto.img || produto.imagem?.href || '/images/placeholder.png',
      // Garantir que preço existe e tem a estrutura correta
      preco: produto.preco ? {
        valor: produto.preco.valor || produto.valor || 0,
        tipo: produto.preco.tipo || produto.vtipo || "UN",
        custoProducao: produto.preco.custoProducao,
        promocao: produto.preco.promocao
      } : {
        valor: produto.valor || 0,
        tipo: produto.vtipo || "UN"
      },
      // Garantir que estoque existe
      estoque: produto.estoque || {
        disponivel: produto.status !== "inativo" && produto.status !== "pause",
        quantidade: undefined,
        minimo: undefined,
        unidadeMedida: produto.vtipo || "UN"
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
    };

    return res.status(200).json(produtoFormatado);
  } catch (error) {
    console.error("Erro ao buscar produto por ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
