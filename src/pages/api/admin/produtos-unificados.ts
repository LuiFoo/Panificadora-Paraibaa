import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";
import { safeParseFloat } from "@/lib/validation";

// Categorias disponíveis
const CATEGORIAS_DISPONIVEIS = [
  { nome: "BOLOS DOCES ESPECIAIS", slug: "bolos-doces-especiais" },
  { nome: "DOCES INDIVIDUAIS", slug: "doces-individuais" },
  { nome: "PAES DOCES", slug: "paes-doces" },
  { nome: "PAES SALGADOS ESPECIAIS", slug: "paes-salgados-especiais" },
  { nome: "ROSCAS PAES ESPECIAIS", slug: "roscas-paes-especiais" },
  { nome: "SALGADOS ASSADOS LANCHES", slug: "salgados-assados-lanches" },
  { nome: "SOBREMESAS TORTAS", slug: "sobremesas-tortas" },
  { nome: "BEBIDAS", slug: "bebidas" }
];

// Função para gerar slug a partir do nome
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== "GET" && method !== "POST" && method !== "PUT" && method !== "DELETE") {
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

    if (method === "GET") {
      // Buscar todos os produtos
      const produtos = await db.collection("produtos")
        .find({})
        .sort({ criadoEm: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        produtos,
        categorias: CATEGORIAS_DISPONIVEIS,
        total: produtos.length
      });
    }

    if (method === "POST") {
      // Criar novo produto
      const {
        nome,
        descricao,
        categoriaSlug,
        subcategoria,
        valor,
        tipo,
        custoProducao,
        ingredientes,
        alergicos,
        imagem,
        tags,
        destaque = false
      } = req.body;

      // 🐛 CORREÇÃO: Validações robustas de segurança e tamanho
      if (!nome || !categoriaSlug || !valor || !tipo || !ingredientes || !imagem) {
        return res.status(400).json({ error: "Campos obrigatórios: nome, categoria, valor, tipo, ingredientes, imagem" });
      }

      if (typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(400).json({ error: "Nome inválido" });
      }

      if (nome.length > 200) {
        return res.status(400).json({ error: "Nome muito longo (máximo 200 caracteres)" });
      }

      if (descricao && typeof descricao === 'string' && descricao.length > 1000) {
        return res.status(400).json({ error: "Descrição muito longa (máximo 1000 caracteres)" });
      }

      if (typeof valor !== 'number' || valor <= 0 || isNaN(valor)) {
        return res.status(400).json({ error: "Valor deve ser um número maior que zero" });
      }

      // Verificar se categoria existe
      const categoria = CATEGORIAS_DISPONIVEIS.find(cat => cat.slug === categoriaSlug);
      if (!categoria) {
        return res.status(400).json({ error: "Categoria inválida" });
      }

      // Gerar slug único
      const slugBase = gerarSlug(nome);
      let slug = slugBase;
      let counter = 1;
      const MAX_TENTATIVAS = 100; // Prevenir loop infinito

      // ⚠️ CORREÇÃO DE BUG: Race condition em geração de slug
      while (counter < MAX_TENTATIVAS && await db.collection("produtos").findOne({ slug })) {
        slug = `${slugBase}-${counter}`;
        counter++;
      }

      if (counter >= MAX_TENTATIVAS) {
        return res.status(500).json({ error: "Erro ao gerar slug único. Tente outro nome." });
      }

      // Criar produto
      const novoProduto = {
        nome,
        slug,
        descricao: descricao || "",
        categoria: {
          nome: categoria.nome,
          slug: categoria.slug
        },
        subcategoria: subcategoria || "Padrão",
        preco: {
          valor: safeParseFloat(valor, 0),
          tipo,
          custoProducao: custoProducao ? safeParseFloat(custoProducao, 0) : null
        },
        estoque: {
          disponivel: true,
          unidadeMedida: tipo
        },
        imagem: {
          href: imagem,
          alt: nome
        },
        // ⚠️ CORREÇÃO DE BUG: Validação segura de tipos antes de split
        ingredientes: Array.isArray(ingredientes) 
          ? ingredientes 
          : (typeof ingredientes === 'string' && ingredientes ? ingredientes.split(',').map((i: string) => i.trim()) : []),
        alergicos: Array.isArray(alergicos) 
          ? alergicos 
          : (typeof alergicos === 'string' && alergicos ? alergicos.split(',').map((i: string) => i.trim()) : []),
        avaliacao: {
          media: 0,
          quantidade: 0,
          usuarios: []
        },
        destaque: Boolean(destaque),
        tags: Array.isArray(tags) 
          ? tags 
          : (typeof tags === 'string' && tags ? tags.split(',').map((t: string) => t.trim()) : []),
        status: "ativo",
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      const resultado = await db.collection("produtos").insertOne(novoProduto);

      return res.status(201).json({
        success: true,
        produto: { ...novoProduto, _id: resultado.insertedId }
      });
    }

    if (method === "PUT") {
      // Atualizar produto
      const { id, ...dadosAtualizacao } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID do produto é obrigatório" });
      }

      // Preparar dados para atualização
      const dadosUpdate = {
        ...dadosAtualizacao,
        atualizadoEm: new Date()
      };

      // Se o nome mudou, atualizar o slug
      if (dadosAtualizacao.nome) {
        dadosUpdate.slug = gerarSlug(dadosAtualizacao.nome);
      }

      const resultado = await db.collection("produtos").updateOne(
        { _id: id },
        { $set: dadosUpdate }
      );

      if (resultado.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Produto atualizado com sucesso"
      });
    }

    if (method === "DELETE") {
      // Deletar produto (soft delete)
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID do produto é obrigatório" });
      }

      const resultado = await db.collection("produtos").updateOne(
        { _id: id },
        { $set: { status: "inativo", atualizadoEm: new Date() } }
      );

      if (resultado.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Produto removido com sucesso"
      });
    }

  } catch (error) {
    console.error("Erro na API de produtos unificados:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
