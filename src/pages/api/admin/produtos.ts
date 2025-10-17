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
      // Buscar todos os produtos
      const produtos = await db.collection("produtos")
        .find({})
        .sort({ dataCriacao: -1 })
        .toArray();

      return res.status(200).json({ success: true, produtos });
    }

    if (method === "POST") {
      const { subc, nome, valor, vtipo, ingredientes, img } = req.body;

      console.log("📦 Tentando criar produto:", { subc, nome, valor, vtipo, ingredientes, img });

      // Validações
      if (!subc || !nome || !valor || !vtipo || !ingredientes || !img) {
        console.log("❌ Validação falhou - campos obrigatórios faltando");
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        console.log("❌ Validação falhou - valor inválido");
        return res.status(400).json({ error: "Valor deve ser um número maior que zero" });
      }

      // Categorias disponíveis para a nova estrutura
      const categoriasDisponiveis = [
        "BOLOS DOCES ESPECIAIS",
        "DOCES INDIVIDUAIS", 
        "PAES DOCES",
        "PAES SALGADOS ESPECIAIS",
        "ROSCAS PAES ESPECIAIS",
        "SALGADOS ASSADOS LANCHES",
        "SOBREMESAS TORTAS",
        "BEBIDAS"
      ];

      if (!categoriasDisponiveis.includes(subc)) {
        console.log("❌ Subcategoria inválida:", subc);
        return res.status(400).json({ error: "Subcategoria inválida" });
      }

      // Gerar slug único
      const slugBase = nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      let slug = slugBase;
      let counter = 1;

      while (await db.collection("produtos").findOne({ slug })) {
        slug = `${slugBase}-${counter}`;
        counter++;
      }

      console.log(`📂 Salvando na coleção unificada: produtos`);

      // Verificar se já existe produto com o mesmo nome
      const produtoExistente = await db.collection("produtos").findOne({ nome });
      if (produtoExistente) {
        console.log("❌ Produto já existe com nome:", nome);
        return res.status(400).json({ error: "Já existe um produto com este nome" });
      }

      const novoProduto = {
        nome,
        slug,
        descricao: ingredientes || "",
        categoria: {
          nome: subc,
          slug: subc.toLowerCase().replace(/\s+/g, "-")
        },
        subcategoria: "Padrão",
        preco: {
          valor: valorNumerico,
          tipo: vtipo
        },
        estoque: {
          disponivel: true,
          unidadeMedida: vtipo
        },
        imagem: {
          href: img,
          alt: nome
        },
        ingredientes: ingredientes ? ingredientes.split(',').map(i => i.trim()) : [],
        alergicos: [],
        avaliacao: {
          media: 0,
          quantidade: 0,
          usuarios: []
        },
        destaque: false,
        tags: [],
        status: "ativo",
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      console.log("✅ Inserindo produto no MongoDB...");
      const result = await db.collection("produtos").insertOne(novoProduto);
      console.log(`✅ Produto inserido na coleção produtos com ID:`, result.insertedId);

      return res.status(201).json({ 
        success: true,
        produtoId: result.insertedId,
        colecao: "produtos",
        message: "Produto criado com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin produtos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
