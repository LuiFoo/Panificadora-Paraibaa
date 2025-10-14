import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

// Mapeamento das coleções antigas para as novas subcategorias
const MAPEAMENTO_COLECOES = {
  "bolos-doces-especiais": "BOLOS DOCES ESPECIAIS",
  "doces-individuais": "DOCES INDIVIDUAIS",
  "paes-doces": "PAES DOCES",
  "paes-salgados-especiais": "PAES SALGADOS ESPECIAIS",
  "roscas-paes-especiais": "ROSCAS PAES ESPECIAIS",
  "salgados-assados-lanches": "SALGADOS ASSADOS LANCHES",
  "sobremesas-tortas": "SOBREMESAS TORTAS"
};

// Subcategorias válidas (apenas estas)
const SUBCATEGORIAS_VALIDAS = [
  "BOLOS DOCES ESPECIAIS",
  "DOCES INDIVIDUAIS",
  "PAES DOCES",
  "PAES SALGADOS ESPECIAIS",
  "ROSCAS PAES ESPECIAIS",
  "SALGADOS ASSADOS LANCHES",
  "SOBREMESAS TORTAS"
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
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    const todosProdutos: ProdutoExistente[] = [];

    // Buscar produtos da nova coleção unificada
    const produtosNovos = await db.collection("produtos")
      .find({})
      .sort({ dataCriacao: -1 })
      .toArray();

    // Adicionar produtos da nova coleção
    for (const produto of produtosNovos) {
      todosProdutos.push({
        _id: produto._id.toString(),
        nome: produto.nome,
        valor: produto.valor,
        vtipo: produto.vtipo,
        ingredientes: produto.ingredientes,
        img: produto.img,
        colecaoOrigem: "produtos",
        subcategoria: produto.subc,
        status: produto.status, // Incluir status
        dataCriacao: produto.dataCriacao,
        dataAtualizacao: produto.dataAtualizacao
      });
    }

    // Buscar produtos das coleções antigas
    for (const [colecaoAntiga, subcategoria] of Object.entries(MAPEAMENTO_COLECOES)) {
      const produtosAntigos = await db.collection(colecaoAntiga)
        .find({ deleted: { $ne: true } })
        .toArray();

      for (const produto of produtosAntigos) {
        todosProdutos.push({
          _id: produto._id.toString(),
          nome: produto.nome || "Produto sem nome",
          valor: produto.valor || 0,
          vtipo: produto.vtipo || "UN",
          ingredientes: produto.ingredientes || produto.descricao || "Ingredientes não especificados",
          img: produto.img || "https://via.placeholder.com/300x200?text=Sem+Imagem",
          colecaoOrigem: colecaoAntiga,
          subcategoria: subcategoria, // SEMPRE usar a subcategoria mapeada da coleção
          status: produto.status, // Incluir status
          dataCriacao: produto.dataCriacao,
          dataAtualizacao: produto.dataAtualizacao
        });
      }
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
      .sort(); // Ordenar alfabeticamente

    return res.status(200).json({ 
      produtos: todosProdutos,
      total: todosProdutos.length,
      subcategorias: subcategoriasUnicas,
      colecoes: Object.keys(MAPEAMENTO_COLECOES).concat(["produtos"])
    });

  } catch (error) {
    console.error("Erro ao buscar todos os produtos:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
