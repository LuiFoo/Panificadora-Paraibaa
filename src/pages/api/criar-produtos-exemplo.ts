import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // 🚨 PROTEÇÃO CRÍTICA: Esta API deleta TODOS os produtos! 
  // Apenas admins com permissão suprema devem ter acesso
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Produtos de exemplo para cada categoria
    const produtosExemplo = [
      // Doces & Sobremesas
      {
        nome: "Bolo de Chocolate com Brigadeiro",
        slug: "bolo-de-chocolate-com-brigadeiro",
        descricao: "Bolo caseiro de chocolate com recheio e cobertura de brigadeiro artesanal.",
        categoria: {
          nome: "BOLOS DOCES ESPECIAIS",
          slug: "bolos-doces-especiais"
        },
        subcategoria: "Tradicional",
        preco: {
          valor: 45.00,
          tipo: "UN"
        },
        estoque: {
          disponivel: true,
          unidadeMedida: "UN"
        },
        imagem: {
          href: "https://i.imgur.com/bolo-chocolate.png",
          alt: "Bolo de chocolate com cobertura de brigadeiro"
        },
        ingredientes: ["Farinha de trigo", "Açúcar", "Ovos", "Leite", "Chocolate em pó", "Brigadeiro artesanal"],
        alergicos: ["Contém glúten", "Contém leite", "Pode conter traços de amendoim"],
        avaliacao: {
          media: 4.8,
          quantidade: 57,
          usuarios: []
        },
        destaque: true,
        tags: ["bolo", "chocolate", "brigadeiro", "caseiro"],
        status: "ativo",
        criadoEm: new Date(),
        atualizadoEm: new Date()
      },
      {
        nome: "Torta de Morango",
        slug: "torta-de-morango",
        descricao: "Deliciosa torta de morango com massa crocante e creme de confeiteiro.",
        categoria: {
          nome: "SOBREMESAS TORTAS",
          slug: "sobremesas-tortas"
        },
        subcategoria: "Frutas",
        preco: {
          valor: 32.00,
          tipo: "UN"
        },
        estoque: {
          disponivel: true,
          unidadeMedida: "UN"
        },
        imagem: {
          href: "https://i.imgur.com/torta-morango.png",
          alt: "Torta de morango com creme"
        },
        ingredientes: ["Massa de biscoito", "Creme de confeiteiro", "Morangos frescos", "Gelatina"],
        alergicos: ["Contém glúten", "Contém leite"],
        avaliacao: {
          media: 4.6,
          quantidade: 23,
          usuarios: []
        },
        destaque: false,
        tags: ["torta", "morango", "sobremesa", "frutas"],
        status: "ativo",
        criadoEm: new Date(),
        atualizadoEm: new Date()
      },
      // Pães & Especiais
      {
        nome: "Pão Francês Artesanal",
        slug: "pao-frances-artesanal",
        descricao: "Pão francês tradicional feito com fermentação natural e ingredientes selecionados.",
        categoria: {
          nome: "PAES SALGADOS ESPECIAIS",
          slug: "paes-salgados-especiais"
        },
        subcategoria: "Tradicional",
        preco: {
          valor: 2.50,
          tipo: "UN"
        },
        estoque: {
          disponivel: true,
          unidadeMedida: "UN"
        },
        imagem: {
          href: "https://i.imgur.com/pao-frances.png",
          alt: "Pão francês artesanal"
        },
        ingredientes: ["Farinha de trigo", "Água", "Sal", "Fermento", "Açúcar"],
        alergicos: ["Contém glúten"],
        avaliacao: {
          media: 4.5,
          quantidade: 89,
          usuarios: []
        },
        destaque: true,
        tags: ["pão", "francês", "tradicional", "artesanal"],
        status: "ativo",
        criadoEm: new Date(),
        atualizadoEm: new Date()
      },
      // Salgados & Lanches
      {
        nome: "Coxinha de Frango",
        slug: "coxinha-de-frango",
        descricao: "Coxinha crocante recheada com frango desfiado temperado.",
        categoria: {
          nome: "SALGADOS ASSADOS LANCHES",
          slug: "salgados-assados-lanches"
        },
        subcategoria: "Fritos",
        preco: {
          valor: 4.50,
          tipo: "UN"
        },
        estoque: {
          disponivel: true,
          unidadeMedida: "UN"
        },
        imagem: {
          href: "https://i.imgur.com/coxinha-frango.png",
          alt: "Coxinha de frango crocante"
        },
        ingredientes: ["Massa de batata", "Frango desfiado", "Cebola", "Alho", "Temperos"],
        alergicos: ["Contém glúten"],
        avaliacao: {
          media: 4.7,
          quantidade: 156,
          usuarios: []
        },
        destaque: true,
        tags: ["coxinha", "frango", "salgado", "frito"],
        status: "ativo",
        criadoEm: new Date(),
        atualizadoEm: new Date()
      },
      // Bebidas
      {
        nome: "Café Expresso",
        slug: "cafe-expresso",
        descricao: "Café expresso cremoso feito com grãos selecionados.",
        categoria: {
          nome: "BEBIDAS",
          slug: "bebidas"
        },
        subcategoria: "Quentes",
        preco: {
          valor: 3.50,
          tipo: "UN"
        },
        estoque: {
          disponivel: true,
          unidadeMedida: "UN"
        },
        imagem: {
          href: "https://i.imgur.com/cafe-expresso.png",
          alt: "Café expresso cremoso"
        },
        ingredientes: ["Grãos de café", "Água"],
        alergicos: [],
        avaliacao: {
          media: 4.4,
          quantidade: 78,
          usuarios: []
        },
        destaque: false,
        tags: ["café", "expresso", "bebida", "quente"],
        status: "ativo",
        criadoEm: new Date(),
        atualizadoEm: new Date()
      }
    ];

    // Limpar coleção produtos primeiro
    await db.collection("produtos").deleteMany({});

    // Inserir produtos de exemplo
    const resultado = await db.collection("produtos").insertMany(produtosExemplo);

    return res.status(201).json({
      success: true,
      message: "Produtos de exemplo criados com sucesso!",
      produtosCriados: resultado.insertedCount,
      produtos: produtosExemplo
    });

  } catch (error) {
    console.error("Erro ao criar produtos de exemplo:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
