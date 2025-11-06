import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

// ⚠️ LIMPEZA: Código comentado removido

// Subcategorias válidas
const SUBCATEGORIAS_VALIDAS = [
  "BOLOS DOCES ESPECIAIS",
  "DOCES INDIVIDUAIS",
  "PAES DOCES",
  "PAES SALGADOS ESPECIAIS",
  "ROSCAS PAES ESPECIAIS",
  "SALGADOS ASSADOS LANCHES",
  "SOBREMESAS TORTAS",
  "BEBIDAS"
];

interface ProdutoExistente {
  _id: string;
  nome: string;
  valor: number;
  vtipo?: string;
  ingredientes?: string;
  descricao?: string;
  img?: string;
  colecaoOrigem: string;
  subcategoria: string;
  status?: string;
  destaque?: boolean;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    const todosProdutos: ProdutoExistente[] = [];

    // Buscar produtos apenas da coleção unificada "produtos"
    const produtos = await db.collection("produtos")
      .find({})
      .sort({ criadoEm: -1, dataCriacao: -1 })
      .toArray();

    // Adicionar produtos da coleção unificada
    for (const produto of produtos) {
      todosProdutos.push({
        _id: produto._id.toString(),
        nome: produto.nome,
        valor: produto.preco?.valor || produto.valor || 0,
        vtipo: produto.preco?.tipo || produto.vtipo || "UN",
        ingredientes: produto.ingredientes || produto.descricao || "Ingredientes não especificados",
        img: produto.imagem?.href || produto.img || "https://via.placeholder.com/300x200?text=Sem+Imagem",
        colecaoOrigem: "produtos",
        subcategoria: produto.subcategoria || produto.subc || "Categoria",
        status: produto.status,
        destaque: produto.destaque === true, // Garantir que seja boolean
        dataCriacao: produto.criadoEm || produto.dataCriacao,
        dataAtualizacao: produto.atualizadoEm || produto.dataAtualizacao
      });
    }

    // Ordenar por data de criação (mais recentes primeiro)
    todosProdutos.sort((a, b) => {
      const dateA = new Date(a.dataCriacao || 0);
      const dateB = new Date(b.dataCriacao || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Extrair subcategorias únicas e filtrar apenas as válidas
    const subcategoriasUnicas = [...new Set(todosProdutos.map(p => p.subcategoria))]
      .filter(sub => sub && SUBCATEGORIAS_VALIDAS.includes(sub))
      .sort();

    const resposta = { 
      success: true,
      produtos: todosProdutos,
      total: todosProdutos.length,
      subcategorias: subcategoriasUnicas,
      colecoes: ["produtos"]
    };

    return res.status(200).json(resposta);

  } catch (error) {
    console.error("Erro ao buscar todos os produtos:", error);
    return res.status(500).json({ 
      success: false,
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
