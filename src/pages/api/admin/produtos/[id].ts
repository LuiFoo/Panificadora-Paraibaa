import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId, Db } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";
import { safeParseFloat } from "@/lib/validation";

// Função para buscar produto na coleção unificada
async function buscarProduto(db: Db, id: string) {
  const produto = await db.collection("produtos").findOne({ _id: new ObjectId(id) });
  return { produto, colecao: "produtos" };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  // Validar método HTTP
  if (!['GET', 'PUT', 'DELETE'].includes(method || '')) {
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "ID do produto é obrigatório" });
  }

  // Validar se o ID é um ObjectId válido
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID do produto inválido" });
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
      const { produto, colecao } = await buscarProduto(db, id);

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        produto: {
          ...produto,
          colecaoOrigem: colecao
        }
      });
    }

    if (method === "PUT") {
      const { subc, nome, valor, vtipo, ingredientes, img, status } = req.body;

      // 🐛 CORREÇÃO: Validações mais robustas
      if (!subc || !nome || !valor || !vtipo || !ingredientes || !img) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      if (typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(400).json({ error: "Nome inválido" });
      }

      if (nome.length > 200) {
        return res.status(400).json({ error: "Nome muito longo (máximo 200 caracteres)" });
      }

      if (typeof valor !== 'number' || valor <= 0 || isNaN(valor) || !isFinite(valor)) {
        return res.status(400).json({ error: "Valor deve ser um número válido e maior que zero" });
      }

      // Verificar se o produto existe
      const { produto: produtoExistente } = await buscarProduto(db, id);
      
      if (!produtoExistente) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Verificar se já existe outro produto com o mesmo nome
      const produtoComMesmoNome = await db.collection("produtos").findOne({ 
        nome, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (produtoComMesmoNome) {
        return res.status(400).json({ error: "Já existe outro produto com este nome" });
      }

      // Atualizar na coleção unificada
      const updateData: Record<string, unknown> = { 
        subcategoria: subc,
        nome,
        preco: {
          valor: safeParseFloat(valor, 0),
          tipo: vtipo
        },
        ingredientes,
        imagem: {
          href: img,
          alt: nome
        },
        atualizadoEm: new Date()
      };

      // Incluir status se fornecido
      if (status !== undefined) {
        updateData.status = status;
      }

      const result = await db.collection("produtos").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto atualizado com sucesso"
      });
    }

    if (method === "DELETE") {
      // Verificar se o produto existe
      const { produto } = await buscarProduto(db, id);
      
      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Deletar da coleção unificada
      const result = await db.collection("produtos").deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto excluído com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin produto:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
