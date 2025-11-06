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
      const body = req.body;
      
      // Verificar se o produto existe
      const { produto: produtoExistente } = await buscarProduto(db, id);
      
      if (!produtoExistente) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Validações básicas
      if (!body.nome || typeof body.nome !== 'string' || body.nome.trim().length === 0) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }

      if (body.nome.length > 200) {
        return res.status(400).json({ error: "Nome muito longo (máximo 200 caracteres)" });
      }

      // Verificar se já existe outro produto com o mesmo nome
      const produtoComMesmoNome = await db.collection("produtos").findOne({ 
        nome: body.nome, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (produtoComMesmoNome) {
        return res.status(400).json({ error: "Já existe outro produto com este nome" });
      }

      // Normalizar arrays para garantir que sejam sempre arrays
      const ingredientesArr: string[] = Array.isArray(body.ingredientes)
        ? body.ingredientes
        : (typeof body.ingredientes === 'string' ? body.ingredientes.split(',').map((i: string) => i.trim()).filter(Boolean) : []);
      const alergicosArr: string[] = Array.isArray(body.alergicos) ? body.alergicos : [];
      const tagsArr: string[] = Array.isArray(body.tags) ? body.tags : [];
      
      // Normalizar galeria dentro de imagem
      const imagemGaleria: string[] = Array.isArray(body.imagem?.galeria) 
        ? body.imagem.galeria 
        : (body.imagem?.galeria && typeof body.imagem.galeria === 'string' 
          ? body.imagem.galeria.split(',').map((s: string) => s.trim()).filter(Boolean) 
          : (Array.isArray(produtoExistente.imagem?.galeria) ? produtoExistente.imagem.galeria : []));

      // Preparar dados de atualização
      const updateData: Record<string, unknown> = {
        nome: body.nome,
        descricao: body.descricao || "",
        categoria: body.categoria || produtoExistente.categoria,
        subcategoria: body.subcategoria || "",
        preco: body.preco || produtoExistente.preco,
        estoque: body.estoque || produtoExistente.estoque,
        imagem: {
          ...(body.imagem || produtoExistente.imagem),
          galeria: imagemGaleria
        },
        ingredientes: ingredientesArr,
        alergicos: alergicosArr,
        destaque: body.destaque !== undefined ? body.destaque : produtoExistente.destaque,
        tags: tagsArr,
        status: body.status || "ativo",
        atualizadoEm: new Date()
      };

      // Gerar/atualizar slug baseado no nome (mesma lógica da criação)
      const slugBase = body.nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      let slug = slugBase;
      let counter = 1;
      const MAX_TENTATIVAS = 100;
      
      // Verificar se já existe outro produto com este slug (exceto o atual)
      while (counter < MAX_TENTATIVAS) {
        const produtoComMesmoSlug = await db.collection("produtos").findOne({ 
          slug,
          _id: { $ne: new ObjectId(id) }
        });
        
        if (!produtoComMesmoSlug) {
          break; // Slug único encontrado
        }
        
        slug = `${slugBase}-${counter}`;
        counter++;
      }
      
      if (counter >= MAX_TENTATIVAS) {
        return res.status(500).json({ error: "Erro ao gerar slug único. Tente outro nome." });
      }
      
      updateData.slug = slug;

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
