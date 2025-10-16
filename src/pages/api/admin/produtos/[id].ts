import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

// Mapeamento das coleções antigas
const MAPEAMENTO_COLECOES = {
  "BOLOS DOCES ESPECIAIS": "bolos-doces-especiais",
  "DOCES INDIVIDUAIS": "doces-individuais",
  "PAES DOCES": "paes-doces",
  "PAES SALGADOS ESPECIAIS": "paes-salgados-especiais",
  "ROSCAS PAES ESPECIAIS": "roscas-paes-especiais",
  "SALGADOS ASSADOS LANCHES": "salgados-assados-lanches",
  "SOBREMESAS TORTAS": "sobremesas-tortas"
};

// Função para buscar produto em todas as coleções
async function buscarProdutoEmTodasColecoes(db: any, id: string) {
  // Primeiro, tentar na coleção "produtos"
  let produto = await db.collection("produtos").findOne({ _id: new ObjectId(id) });
  
  if (produto) {
    return { produto, colecao: "produtos" };
  }

  // Se não encontrou, buscar nas coleções antigas
  const colecoes = Object.values(MAPEAMENTO_COLECOES);
  for (const nomeColecao of colecoes) {
    produto = await db.collection(nomeColecao).findOne({ _id: new ObjectId(id) });
    if (produto) {
      return { produto, colecao: nomeColecao };
    }
  }

  return { produto: null, colecao: null };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

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
      const { produto, colecao } = await buscarProdutoEmTodasColecoes(db, id);

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

      // Validações
      if (!subc || !nome || !valor || !vtipo || !ingredientes || !img) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      if (valor <= 0) {
        return res.status(400).json({ error: "Valor deve ser maior que zero" });
      }

      // Primeiro, encontrar em qual coleção o produto está
      const { produto: produtoExistente, colecao: colecaoAtual } = await buscarProdutoEmTodasColecoes(db, id);
      
      if (!produtoExistente) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Determinar a nova coleção baseada na subcategoria
      const novaColecao = MAPEAMENTO_COLECOES[subc as keyof typeof MAPEAMENTO_COLECOES];
      
      if (!novaColecao) {
        return res.status(400).json({ error: "Subcategoria inválida" });
      }

      // Verificar se já existe outro produto com o mesmo nome na nova coleção
      const produtoComMesmoNome = await db.collection(novaColecao).findOne({ 
        nome, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (produtoComMesmoNome) {
        return res.status(400).json({ error: "Já existe outro produto com este nome nesta categoria" });
      }

      // Se o produto está mudando de coleção, deletar da coleção antiga e inserir na nova
      if (colecaoAtual !== novaColecao) {
        console.log(`📦 Movendo produto da coleção ${colecaoAtual} para ${novaColecao}`);
        
        // Deletar da coleção antiga
        await db.collection(colecaoAtual).deleteOne({ _id: new ObjectId(id) });
        
        // Inserir na nova coleção
        const novoProduto = {
          _id: new ObjectId(id),
          subc,
          nome,
          valor: parseFloat(valor),
          vtipo,
          ingredientes,
          img,
          status: status || produtoExistente.status || "active",
          dataCriacao: produtoExistente.dataCriacao || new Date(),
          dataAtualizacao: new Date()
        };
        
        await db.collection(novaColecao).insertOne(novoProduto);
      } else {
        // Atualizar na mesma coleção
        const updateData: any = { 
          subc,
          nome,
          valor: parseFloat(valor),
          vtipo,
          ingredientes,
          img,
          dataAtualizacao: new Date()
        };

        // Incluir status se fornecido
        if (status !== undefined) {
          updateData.status = status;
        }

        const result = await db.collection(novaColecao).updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Produto não encontrado" });
        }
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto atualizado com sucesso"
      });
    }

    if (method === "DELETE") {
      // Encontrar em qual coleção o produto está
      const { produto, colecao } = await buscarProdutoEmTodasColecoes(db, id);
      
      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Deletar da coleção correta
      const result = await db.collection(colecao).deleteOne({ _id: new ObjectId(id) });

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
