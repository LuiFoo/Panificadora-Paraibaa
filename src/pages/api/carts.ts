import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb"; // Importando a conexão com o MongoDB

// Definindo a interface para o produto no carrinho
interface ProdutoCarrinho {
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
  img?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const client = await clientPromise;
    const db = client.db("padaria");  // Nome do seu banco de dados

    const userId = req.headers["user-id"];  // Autenticação (passando userId no header)

    if (method === "GET") {
      // Recuperar o carrinho
      const cart = await db.collection("carrinhos").findOne({ userId });

      if (cart) {
        return res.status(200).json(cart);
      } else {
        return res.status(404).json({ error: "Carrinho não encontrado" });
      }
    }

    if (method === "POST") {
      // Adicionar produto ao carrinho
      const { produto } = req.body;

      const existingCart = await db.collection("carrinhos").findOne({ userId });

      if (existingCart) {
        // Atualizar carrinho existente
        await db.collection("carrinhos").updateOne(
          { userId },
          { $push: { produtos: produto } }
        );
      } else {
        // Criar carrinho novo
        await db.collection("carrinhos").insertOne({
          userId,
          produtos: [produto],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return res.status(200).json({ message: "Produto adicionado ao carrinho!" });
    }

    if (method === "DELETE") {
      // Remover produto do carrinho
      const produtoId = req.query.produtoId as string;  // Certificando-se de que produtoId é uma string

      const cart = await db.collection("carrinhos").findOne({ userId });

      if (!cart) {
        return res.status(404).json({ error: "Carrinho não encontrado" });
      }

      // Filtra o produto que deve ser removido, usando o tipo ProdutoCarrinho
      const updatedProdutos = cart.produtos.filter(
        (produto: ProdutoCarrinho) => produto.produtoId !== produtoId
      );

      // Atualizar o carrinho no banco de dados
      await db.collection("carrinhos").updateOne(
        { userId },
        { $set: { produtos: updatedProdutos, updatedAt: new Date() } }
      );

      return res.status(200).json({ message: "Produto removido do carrinho", produtos: updatedProdutos });
    }
    
  } catch (error) {
    console.error("Erro no carrinho:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
