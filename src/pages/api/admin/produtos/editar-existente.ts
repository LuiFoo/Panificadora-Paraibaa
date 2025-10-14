import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { ObjectId } from "mongodb";

// Mapeamento das coleções antigas
const MAPEAMENTO_COLECOES = {
  "paes-doces": "Pães Doces",
  "bolos-doces-especiais": "Bolos, Doces e Especiais", 
  "doces-individuais": "Doces Individuais",
  "paes-salgados-especiais": "Pães Salgados Especiais",
  "roscas-paes-especiais": "Roscas, Pães Especiais",
  "salgados-assados-lanches": "Salgados Assados e Lanches",
  "sobremesas-tortas": "Sobremesas e Tortas"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    if (method === "PUT") {
      const { id, colecaoOrigem, nome, valor, vtipo, ingredientes, img } = req.body;

      // Validações
      if (!id || !colecaoOrigem || !nome || !valor) {
        return res.status(400).json({ error: "ID, coleção, nome e valor são obrigatórios" });
      }

      if (valor <= 0) {
        return res.status(400).json({ error: "Valor deve ser maior que zero" });
      }

      // Validar se o ID é válido
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const updateData: Record<string, string | number | Date> = {
        nome,
        valor: parseFloat(valor),
        dataAtualizacao: new Date()
      };

      // Adicionar campos opcionais se fornecidos
      if (vtipo) updateData.vtipo = vtipo;
      if (ingredientes) updateData.ingredientes = ingredientes;
      if (img) updateData.img = img;

      let result;

      if (colecaoOrigem === "produtos") {
        // Atualizar na nova coleção unificada
        result = await db.collection("produtos").updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
      } else if (MAPEAMENTO_COLECOES[colecaoOrigem as keyof typeof MAPEAMENTO_COLECOES]) {
        // Atualizar na coleção antiga
        result = await db.collection(colecaoOrigem).updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
      } else {
        return res.status(400).json({ error: "Coleção de origem inválida" });
      }

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto atualizado com sucesso"
      });
    }

    if (method === "DELETE") {
      const { id, colecaoOrigem } = req.body;

      if (!id || !colecaoOrigem) {
        return res.status(400).json({ error: "ID e coleção de origem são obrigatórios" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      let result;

      if (colecaoOrigem === "produtos") {
        // Excluir da nova coleção unificada
        result = await db.collection("produtos").deleteOne({ _id: new ObjectId(id) });
      } else if (MAPEAMENTO_COLECOES[colecaoOrigem as keyof typeof MAPEAMENTO_COLECOES]) {
        // Marcar como deletado na coleção antiga (soft delete)
        result = await db.collection(colecaoOrigem).updateOne(
          { _id: new ObjectId(id) },
          { $set: { deleted: true, dataAtualizacao: new Date() } }
        );
      } else {
        return res.status(400).json({ error: "Coleção de origem inválida" });
      }

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      return res.status(200).json({ 
        success: true,
        message: "Produto excluído com sucesso"
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

