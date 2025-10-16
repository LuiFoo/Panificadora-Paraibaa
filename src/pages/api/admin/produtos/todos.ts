import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

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

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    console.log("🔍 Iniciando busca de todos os produtos...");
    const client = await clientPromise;
    const db = client.db("paraiba");

    const todosProdutos: ProdutoExistente[] = [];

    // Buscar produtos da nova coleção unificada
    console.log("📦 Buscando produtos da coleção 'produtos'...");
    const produtosNovos = await db.collection("produtos")
      .find({})
      .sort({ dataCriacao: -1 })
      .toArray();
    console.log(`📦 Encontrados ${produtosNovos.length} produtos na coleção 'produtos'`);

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
    console.log("📂 Buscando produtos das coleções antigas...");
    for (const [colecaoAntiga, subcategoria] of Object.entries(MAPEAMENTO_COLECOES)) {
      console.log(`📂 Buscando na coleção: ${colecaoAntiga}`);
      const produtosAntigos = await db.collection(colecaoAntiga)
        .find({ deleted: { $ne: true } })
        .toArray();
      console.log(`📂 Encontrados ${produtosAntigos.length} produtos na coleção '${colecaoAntiga}'`);

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

    console.log(`✅ Total de produtos encontrados: ${todosProdutos.length}`);

    // Extrair subcategorias únicas e filtrar apenas as válidas
    const subcategoriasUnicas = [...new Set(todosProdutos.map(p => p.subcategoria))]
      .filter(sub => sub && SUBCATEGORIAS_VALIDAS.includes(sub))
      .sort(); // Ordenar alfabeticamente

    const resposta = { 
      success: true,
      produtos: todosProdutos,
      total: todosProdutos.length,
      subcategorias: subcategoriasUnicas,
      colecoes: Object.keys(MAPEAMENTO_COLECOES).concat(["produtos"])
    };

    console.log("📤 Retornando resposta:", { 
      success: resposta.success, 
      total: resposta.total, 
      subcategorias: resposta.subcategorias.length 
    });

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
