import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

interface Produto {
  _id?: string;
  subc: string; // subcategoria
  nome: string;
  valor: number;
  vtipo: string; // tipo de venda (UN, KG, etc)
  ingredientes: string;
  img: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    if (method === "GET") {
      // Buscar todos os produtos
      const produtos = await db.collection("produtos")
        .find({})
        .sort({ dataCriacao: -1 })
        .toArray();

      return res.status(200).json({ produtos });
    }

    if (method === "POST") {
      const { subc, nome, valor, vtipo, ingredientes, img } = req.body;

      console.log("📦 Tentando criar produto:", { subc, nome, valor, vtipo, ingredientes, img });

      // Validações
      if (!subc || !nome || !valor || !vtipo || !ingredientes || !img) {
        console.log("❌ Validação falhou - campos obrigatórios faltando");
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      if (valor <= 0) {
        console.log("❌ Validação falhou - valor inválido");
        return res.status(400).json({ error: "Valor deve ser maior que zero" });
      }

      // Mapear subcategoria para nome da coleção
      const mapeamentoColecoes: { [key: string]: string } = {
        "BOLOS DOCES ESPECIAIS": "bolos-doces-especiais",
        "DOCES INDIVIDUAIS": "doces-individuais",
        "PAES DOCES": "paes-doces",
        "PAES SALGADOS ESPECIAIS": "paes-salgados-especiais",
        "ROSCAS PAES ESPECIAIS": "roscas-paes-especiais",
        "SALGADOS ASSADOS LANCHES": "salgados-assados-lanches",
        "SOBREMESAS TORTAS": "sobremesas-tortas"
      };

      const nomeColecao = mapeamentoColecoes[subc];
      
      if (!nomeColecao) {
        console.log("❌ Subcategoria inválida:", subc);
        return res.status(400).json({ error: "Subcategoria inválida" });
      }

      console.log(`📂 Salvando na coleção: ${nomeColecao}`);

      // Verificar se já existe produto com o mesmo nome na coleção específica
      const produtoExistente = await db.collection(nomeColecao).findOne({ nome });
      if (produtoExistente) {
        console.log("❌ Produto já existe com nome:", nome);
        return res.status(400).json({ error: "Já existe um produto com este nome nesta categoria" });
      }

      const novoProduto = {
        subc,
        nome,
        valor: parseFloat(valor),
        vtipo,
        ingredientes,
        img,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      };

      console.log("✅ Inserindo produto no MongoDB...");
      const result = await db.collection(nomeColecao).insertOne(novoProduto);
      console.log(`✅ Produto inserido na coleção ${nomeColecao} com ID:`, result.insertedId);

      return res.status(201).json({ 
        success: true,
        produtoId: result.insertedId,
        colecao: nomeColecao,
        message: "Produto criado com sucesso"
      });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de admin produtos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
