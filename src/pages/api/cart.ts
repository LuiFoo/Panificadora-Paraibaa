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
  const login = req.query.userId as string; // Pega o login da query

  console.log("Login recebido:", login); // Log para verificar o login

  try {
    // Conecta com o MongoDB
    const client = await clientPromise;
    const db = client.db("paraiba"); // Banco de dados correto

    // Método GET: Buscar o carrinho do usuário
    if (method === "GET") {
      console.log("Buscando carrinho para o login:", login);  // Log para ver o que está sendo buscado

      // Recupera o carrinho usando o login
      const user = await db.collection("users").findOne({ login });

      if (user && user.carrinho) {
        return res.status(200).json(user.carrinho);  // Retorna o carrinho
      } else {
        return res.status(404).json({ error: "Carrinho não encontrado" });
      }
    }

    // Método POST: Adicionar ou atualizar o produto no carrinho
    if (method === "POST") {
      const { produtoId, nome, valor, quantidade, img } = req.body;

      // Validação dos dados de entrada
      if (!produtoId || !nome || !valor || quantidade <= 0) {
        return res.status(400).json({ error: "Dados inválidos para adicionar produto" });
      }

      const user = await db.collection("users").findOne({ login });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const updatedCarrinho = [...user.carrinho.produtos];

      // Verifica se o produto já existe no carrinho
      const existingProductIndex = updatedCarrinho.findIndex((item: ProdutoCarrinho) => item.produtoId === produtoId);

      if (existingProductIndex > -1) {
        // Se o produto já existir, atualiza a quantidade
        updatedCarrinho[existingProductIndex].quantidade += quantidade;
      } else {
        // Caso contrário, adiciona o novo produto ao carrinho
        updatedCarrinho.push({ produtoId, nome, valor, quantidade, img });
      }

      // Atualiza o carrinho no MongoDB
      await db.collection("users").updateOne(
        { login },
        { $set: { "carrinho.produtos": updatedCarrinho } }
      );

      return res.status(200).json({ msg: "Produto adicionado ou atualizado no carrinho" });
    }

    // Método PUT: Atualizar a quantidade de um produto no carrinho
    if (method === "PUT") {
      const { produtoId, quantidade } = req.body;

      if (!produtoId || quantidade <= 0) {
        return res.status(400).json({ error: "Dados inválidos para atualização" });
      }

      const user = await db.collection("users").findOne({ login });

      if (!user || !user.carrinho) {
        return res.status(404).json({ error: "Carrinho não encontrado" });
      }

      // Atualiza a quantidade do produto
      const updatedCarrinho = user.carrinho.produtos.map((item: ProdutoCarrinho) =>
        item.produtoId === produtoId
          ? { ...item, quantidade } // Atualiza a quantidade
          : item
      );

      // Atualiza o carrinho do usuário no MongoDB
      await db.collection("users").updateOne(
        { login },
        { $set: { "carrinho.produtos": updatedCarrinho } }
      );

      return res.status(200).json({ msg: "Quantidade do produto atualizada" });
    }

    // Método DELETE: Remover um produto do carrinho
    if (method === "DELETE") {
      const { produtoId } = req.body;

      if (!produtoId) {
        return res.status(400).json({ error: "ProdutoId é necessário para remoção" });
      }

      const user = await db.collection("users").findOne({ login });

      if (!user || !user.carrinho) {
        return res.status(404).json({ error: "Carrinho não encontrado" });
      }

      // Filtra os produtos para remover o item do carrinho
      const updatedCarrinho = user.carrinho.produtos.filter((item: ProdutoCarrinho) => item.produtoId !== produtoId);

      // Atualiza o carrinho do usuário no MongoDB
      await db.collection("users").updateOne(
        { login },
        { $set: { "carrinho.produtos": updatedCarrinho } }
      );

      return res.status(200).json({ msg: "Produto removido do carrinho" });
    }

    // Método não permitido
    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro no carrinho:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
