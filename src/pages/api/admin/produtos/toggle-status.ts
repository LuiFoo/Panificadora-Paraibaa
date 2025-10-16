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
async function buscarProdutoEmTodasColecoes(db: { collection: (name: string) => any }, id: string) {
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
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Verificar se o usuário é admin
  const { isAdmin, error } = await protegerApiAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ error });
  }

  try {
    const { id } = req.query;
    const { status } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID do produto é obrigatório" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID do produto inválido" });
    }

    if (!status || !["active", "pause"].includes(status)) {
      return res.status(400).json({ error: "Status deve ser 'active' ou 'pause'" });
    }

    const client = await clientPromise;
    const db = client.db("paraiba");

    // Encontrar em qual coleção o produto está
    const { produto, colecao } = await buscarProdutoEmTodasColecoes(db, id);
    
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Atualizar o status na coleção correta
    const result = await db.collection(colecao).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          dataAtualizacao: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    return res.status(200).json({ 
      success: true,
      message: `Produto ${status === "active" ? "ativado" : "pausado"} com sucesso`,
      status
    });

  } catch (error) {
    console.error("Erro ao alterar status do produto:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
