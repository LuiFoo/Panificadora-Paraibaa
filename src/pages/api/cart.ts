import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb"; // Conexão com MongoDB

interface ProdutoCarrinho {
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
  img?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const login = req.query.userId as string;

  console.log("Login recebido:", login);

  try {
    // Corrigindo a inicialização da variável client
    const client = await clientPromise;
    const db = client.db("paraiba");

    const user = await db.collection("users").findOne({ login });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Inicializa o carrinho caso não exista
    if (!user.carrinho) {
      user.carrinho = { produtos: [] };
    }

    if (method === "POST") {
      const { produtoId, nome, valor, quantidade, img } = req.body;

      if (!produtoId || !nome || !valor || quantidade <= 0) {
        return res.status(400).json({ error: "Dados inválidos para adicionar produto" });
      }

      const existingProductIndex = user.carrinho.produtos.findIndex(
        (item: ProdutoCarrinho) => item.produtoId === produtoId
      );

      if (existingProductIndex > -1) {
        user.carrinho.produtos[existingProductIndex].quantidade += quantidade;
      } else {
        user.carrinho.produtos.push({ produtoId, nome, valor, quantidade, img });
      }

      await db.collection("users").updateOne(
        { login },
        { $set: { "carrinho.produtos": user.carrinho.produtos } }
      );

      return res.status(200).json({ msg: "Produto adicionado ou atualizado no carrinho" });
    }

    if (method === "PUT") {
      const { produtoId, quantidade } = req.body;

      if (!produtoId || quantidade <= 0) {
        return res.status(400).json({ error: "Dados inválidos para atualização" });
      }

      const updatedCarrinho = user.carrinho.produtos.map((item: ProdutoCarrinho) =>
        item.produtoId === produtoId ? { ...item, quantidade } : item
      );

      await db.collection("users").updateOne(
        { login },
        { $set: { "carrinho.produtos": updatedCarrinho } }
      );

      return res.status(200).json({ msg: "Quantidade do produto atualizada" });
    }

    if (method === "DELETE") {
      const { produtoId } = req.body;

      if (!produtoId) {
        return res.status(400).json({ error: "ProdutoId é necessário para remoção" });
      }

      const updatedCarrinho = user.carrinho.produtos.filter(
        (item: ProdutoCarrinho) => item.produtoId !== produtoId
      );

      await db.collection("users").updateOne(
        { login },
        { $set: { "carrinho.produtos": updatedCarrinho } }
      );

      return res.status(200).json({ msg: "Produto removido do carrinho" });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro no carrinho:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
