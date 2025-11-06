import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

// Interface para a nova estrutura de produto
interface ProdutoUnificado {
  _id: string;
  nome: string;
  slug: string;
  descricao: string;
  categoria: {
    nome: string;
    slug: string;
  };
  subcategoria: string;
  preco: {
    valor: number;
    tipo: string;
    custoProducao?: number;
    promocao?: {
      ativo: boolean;
      valorPromocional: number;
      inicio: Date;
      fim: Date;
    };
  };
  estoque: {
    disponivel: boolean;
    quantidade?: number;
    minimo?: number;
    unidadeMedida: string;
  };
  imagem: {
    href: string;
    alt: string;
  };
  ingredientes: string[];
  alergicos: string[];
  avaliacao: {
    media: number;
    quantidade: number;
    usuarios?: Array<{
      userId: string;
      nota: number;
      dataCriacao: Date;
      dataAtualizacao: Date;
    }>;
  };
  destaque: boolean;
  tags: string[];
  status: "ativo" | "inativo" | "sazonal";
  criadoEm: Date;
  atualizadoEm: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Agrupar produtos por categoria
    const produtosAgrupados: Record<string, ProdutoUnificado[]> = {
      doces: [],
      paes: [],
      salgados: [],
      bebidas: []
    };

    // Mapeamento de categorias para os grupos principais
    const mapeamentoCategorias: Record<string, string> = {
      "bolos-doces-especiais": "doces",
      "doces-individuais": "doces",
      "paes-doces": "doces",
      "sobremesas-tortas": "doces",
      "paes-salgados-especiais": "paes",
      "roscas-paes-especiais": "paes",
      "salgados-assados-lanches": "salgados",
      "bebidas": "bebidas"
    };


    // Buscar produtos apenas da coleção unificada "produtos"
    const produtos = await db.collection("produtos")
      .find({ 
        status: { $ne: "inativo" }
      })
      .sort({ 
        destaque: -1,
        criadoEm: -1 
      })
      .toArray();

    // Processar produtos e agrupar por categoria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    produtos.forEach((produto: any) => {
      let categoriaSlug: string;
      let grupoPrincipal: string;

      // Verificar se tem categoria estruturada
      if (produto.categoria?.slug) {
        categoriaSlug = produto.categoria.slug;
        grupoPrincipal = mapeamentoCategorias[categoriaSlug];
      } else {
        // Usar subcategoria para determinar categoria
        const subc = produto.subc || produto.subcategoria || '';
        categoriaSlug = subc.toLowerCase().replace(/\s+/g, '-');
        grupoPrincipal = mapeamentoCategorias[categoriaSlug];
      }
      
      if (grupoPrincipal && produtosAgrupados[grupoPrincipal]) {
        const produtoUnificado: ProdutoUnificado = {
          _id: produto._id.toString(),
          nome: produto.nome,
          slug: produto.slug || produto._id.toString(),
          descricao: produto.descricao || produto.ingredientes || "",
          categoria: produto.categoria || {
            nome: produto.subc || produto.subcategoria || "Categoria",
            slug: categoriaSlug
          },
          subcategoria: produto.subcategoria || produto.subc || "Padrão",
          preco: {
            valor: produto.preco?.valor || produto.valor || 0,
            tipo: produto.preco?.tipo || produto.vtipo || "UN",
            custoProducao: produto.preco?.custoProducao,
            promocao: produto.preco?.promocao
          },
          estoque: produto.estoque || {
            disponivel: produto.status !== "pause" && produto.status !== "inativo",
            unidadeMedida: produto.vtipo || "UN"
          },
          imagem: produto.imagem || {
            href: produto.img || '/images/placeholder.png',
            alt: produto.nome || 'Produto'
          },
          ingredientes: Array.isArray(produto.ingredientes) ? produto.ingredientes : 
            (typeof produto.ingredientes === 'string' ? produto.ingredientes.split(',').map((i: string) => i.trim()).filter(Boolean) : []),
          alergicos: Array.isArray(produto.alergicos) ? produto.alergicos : [],
          avaliacao: produto.avaliacao || {
            media: produto.mediaAvaliacao || 0,
            quantidade: produto.totalAvaliacoes || 0,
            usuarios: []
          },
          destaque: produto.destaque || false,
          tags: Array.isArray(produto.tags) ? produto.tags : [],
          status: produto.status === "pause" ? "inativo" : "ativo",
          criadoEm: produto.criadoEm || produto.dataCriacao || new Date(),
          atualizadoEm: produto.atualizadoEm || produto.dataAtualizacao || new Date()
        };
        
        produtosAgrupados[grupoPrincipal].push(produtoUnificado);
      }
    });

    return res.status(200).json(produtosAgrupados);
  } catch (error) {
    console.error("Erro ao buscar produtos unificados:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
