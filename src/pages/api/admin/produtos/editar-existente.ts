import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";
import { protegerApiAdmin } from "@/lib/adminAuth";

// Usar apenas a coleção unificada "produtos"

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

    if (method === "PUT") {
      const { id, nome, valor, vtipo, ingredientes, img } = req.body;

      // Validações
      if (!id || !nome || !valor) {
        return res.status(400).json({ error: "ID, nome e valor são obrigatórios" });
      }

      if (valor <= 0) {
        return res.status(400).json({ error: "Valor deve ser maior que zero" });
      }

      // Validar se o ID é válido
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const updateData: Record<string, any> = {
        nome,
        preco: {
          valor: parseFloat(valor),
          tipo: vtipo || "UN"
        },
        atualizadoEm: new Date()
      };

      // Adicionar campos opcionais se fornecidos
      if (ingredientes) updateData.ingredientes = ingredientes;
      if (img) updateData.imagem = { href: img, alt: nome };

      // Atualizar na coleção unificada
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

    if (method === "PATCH") {
      // Método para atualizar apenas o status do produto (pausar/ativar)
      const { id, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      let result;

      if (status === "active") {
        // Remover o campo status se ativar
        result = await db.collection("produtos").updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { atualizadoEm: new Date() },
            $unset: { status: "" }
          }
        );
      } else {
        result = await db.collection("produtos").updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              status: "pause",
              atualizadoEm: new Date()
            }
          }
        );
      }

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Se o produto foi pausado, remover de todos os carrinhos
      if (status === "pause") {
        try {
          // Remover o produto de todos os carrinhos dos usuários
          const updateOperation = {
            $pull: { 
              "carrinho.produtos": { produtoId: id }
            },
            $set: {
              "carrinho.updatedAt": new Date().toISOString()
            }
          };
          
          await db.collection("users").updateMany(
            { "carrinho.produtos.produtoId": id },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateOperation as any
          );
          
          console.log(`Produto ${id} removido de todos os carrinhos após ser pausado`);
        } catch (error) {
          console.error("Erro ao remover produto dos carrinhos:", error);
          // Não falhar a operação principal se houver erro na remoção dos carrinhos
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: `Produto ${status === "pause" ? "pausado" : "ativado"} com sucesso` 
      });
    }

    if (method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      // Excluir permanentemente da coleção unificada
      const deleteResult = await db.collection("produtos").deleteOne({ _id: new ObjectId(id) });

      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto excluído definitivamente com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de edição de produtos existentes:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      detalhes: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

