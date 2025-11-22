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
      // Categorias antigas (slugs) - para compatibilidade com produtos antigos
      "bolos-doces-especiais": "doces",
      "doces-individuais": "doces",
      "paes-doces": "doces",
      "sobremesas-tortas": "doces",
      "paes-salgados-especiais": "paes",
      "roscas-paes-especiais": "paes",
      "salgados-assados-lanches": "salgados",
      "bebidas": "bebidas",
      // Novas subcategorias (valores exatos do select)
      "Doces & Sobremesas": "doces",
      "Pães & Especiais": "paes",
      "Salgados & Lanches": "salgados",
      "Bebidas": "bebidas"
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
      let categoriaSlug: string = '';
      let grupoPrincipal: string | null = null;

      // Verificar se tem categoria estruturada (produtos antigos)
      if (produto.categoria?.slug) {
        categoriaSlug = produto.categoria.slug;
        grupoPrincipal = mapeamentoCategorias[categoriaSlug];
      }
      
      // Se não encontrou pela categoria, usar subcategoria (produtos novos)
      if (!grupoPrincipal) {
        const subc = produto.subcategoria || produto.subc || '';
        if (subc) {
          // Usar o valor exato da subcategoria (vem do select)
          grupoPrincipal = mapeamentoCategorias[subc];
          
          // Fallback: se não encontrou no mapeamento exato, tentar normalizar (para produtos antigos)
          if (!grupoPrincipal) {
            const subcNormalizada = subc
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove acentos
              .trim();
            
            if (subcNormalizada.includes('doce') || subcNormalizada.includes('sobremesa')) {
              grupoPrincipal = 'doces';
            } else if (subcNormalizada.includes('pao') || subcNormalizada.includes('paes') || subcNormalizada.includes('especial')) {
              grupoPrincipal = 'paes';
            } else if (subcNormalizada.includes('salgado') || subcNormalizada.includes('lanche')) {
              grupoPrincipal = 'salgados';
            } else if (subcNormalizada.includes('bebida')) {
              grupoPrincipal = 'bebidas';
            }
          }
          
          // Definir categoriaSlug baseado na subcategoria se não foi definido
          if (!categoriaSlug && grupoPrincipal) {
            categoriaSlug = subc.toLowerCase().replace(/\s+/g, '-');
          }
        }
      }
      
      // Filtrar produtos: apenas incluir se:
      // 1. Produtos novos: têm subcategoria exata válida ("Doces & Sobremesas", etc.)
      // 2. Produtos antigos: têm categoria.slug válida (mapeada para grupos)
      const subcategoriasValidas = ["Doces & Sobremesas", "Pães & Especiais", "Salgados & Lanches", "Bebidas"];
      const temSubcategoriaValida = produto.subcategoria && subcategoriasValidas.includes(produto.subcategoria);
      const ehProdutoAntigo = produto.categoria?.slug && mapeamentoCategorias[produto.categoria.slug] && !temSubcategoriaValida;
      
      // Só incluir se tem grupoPrincipal definido E (tem subcategoria válida OU é produto antigo)
      if (grupoPrincipal && produtosAgrupados[grupoPrincipal] && (temSubcategoriaValida || ehProdutoAntigo)) {
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
          avaliacao: produto.avaliacao || {
            media: produto.mediaAvaliacao || 0,
            quantidade: produto.totalAvaliacoes || 0,
            usuarios: []
          },
          destaque: produto.destaque || false,
          tags: produto.tags === null || produto.tags === undefined
            ? []
            : (Array.isArray(produto.tags) 
              ? produto.tags 
              : (typeof produto.tags === 'string' && produto.tags.trim() 
                ? produto.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                : [])),
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
