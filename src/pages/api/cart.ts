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
  console.log("Método:", method);
  console.log("Body recebido:", req.body);

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

    // Se for GET, retorna os produtos do carrinho
    if (method === "GET") {
      return res.status(200).json({ 
        produtos: user.carrinho.produtos || [],
        updatedAt: user.carrinho.updatedAt || new Date().toISOString()
      });
    }

    if (method === "POST") {
      const { produtoId, nome, valor, quantidade, img } = req.body;
      console.log("Dados recebidos na API:", { produtoId, nome, valor, quantidade, img });

      if (!produtoId || !nome || !valor || quantidade <= 0) {
        console.log("Dados inválidos:", { produtoId, nome, valor, quantidade });
        return res.status(400).json({ error: "Dados inválidos para adicionar produto" });
      }

      console.log("Carrinho atual do usuário:", user.carrinho.produtos);
      const existingProductIndex = user.carrinho.produtos.findIndex(
        (item: ProdutoCarrinho) => item.produtoId === produtoId
      );

      console.log("Índice do produto existente:", existingProductIndex);

      if (existingProductIndex > -1) {
        console.log("Produto já existe, atualizando quantidade de", user.carrinho.produtos[existingProductIndex].quantidade, "para", user.carrinho.produtos[existingProductIndex].quantidade + quantidade);
        user.carrinho.produtos[existingProductIndex].quantidade += quantidade;
      } else {
        console.log("Novo produto, adicionando ao carrinho");
        user.carrinho.produtos.push({ produtoId, nome, valor, quantidade, img });
      }

      await db.collection("users").updateOne(
        { login },
        { 
          $set: { 
            "carrinho.produtos": user.carrinho.produtos,
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      console.log("Carrinho atualizado no MongoDB:", user.carrinho.produtos);
      return res.status(200).json({ 
        msg: "Produto adicionado ou atualizado no carrinho",
        produtos: user.carrinho.produtos 
      });
    }

    if (method === "PUT") {
      const { produtoId, quantidade, produtos } = req.body;
      console.log("Atualizando carrinho - produtoId:", produtoId, "quantidade:", quantidade, "produtos:", produtos);

      // Se produtos foi enviado, atualizar todo o carrinho (para remoção de produtos pausados)
      if (produtos && Array.isArray(produtos)) {
        console.log("Atualizando carrinho completo com produtos:", produtos);
        await db.collection("users").updateOne(
          { login },
          { 
            $set: { 
              "carrinho.produtos": produtos,
              "carrinho.updatedAt": new Date().toISOString()
            } 
          }
        );
        return res.status(200).json({ 
          msg: "Carrinho atualizado com sucesso",
          produtos: produtos 
        });
      }

      if (!produtoId || quantidade <= 0) {
        console.log("Dados inválidos para atualização:", { produtoId, quantidade });
        return res.status(400).json({ error: "Dados inválidos para atualização" });
      }

      console.log("Carrinho antes da atualização:", user.carrinho.produtos);
      const updatedCarrinho = user.carrinho.produtos.map((item: ProdutoCarrinho) =>
        item.produtoId === produtoId ? { ...item, quantidade } : item
      );
      console.log("Carrinho após atualização:", updatedCarrinho);

      await db.collection("users").updateOne(
        { login },
        { 
          $set: { 
            "carrinho.produtos": updatedCarrinho,
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      return res.status(200).json({ msg: "Quantidade do produto atualizada" });
    }

    // Limpar todo o carrinho (quando produtoId é vazio)
    if (method === "DELETE" && req.body.produtoId === "") {
      console.log("Limpando carrinho completo para usuário:", login);
      console.log("Carrinho antes da limpeza:", user.carrinho.produtos);
      
      const updateResult = await db.collection("users").updateOne(
        { login },
        { 
          $set: { 
            "carrinho.produtos": [],
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      console.log("Resultado da atualização:", updateResult);
      console.log("Carrinho limpo no MongoDB para usuário:", login);
      return res.status(200).json({ msg: "Carrinho limpo com sucesso" });
    }

    // Remover produto específico
    if (method === "DELETE") {
      const { produtoId } = req.body;
      console.log("Removendo produto específico:", produtoId);

      if (!produtoId) {
        console.log("ProdutoId não fornecido para remoção");
        return res.status(400).json({ error: "ProdutoId é necessário para remoção" });
      }

      const updatedCarrinho = user.carrinho.produtos.filter(
        (item: ProdutoCarrinho) => item.produtoId !== produtoId
      );

      await db.collection("users").updateOne(
        { login },
        { 
          $set: { 
            "carrinho.produtos": updatedCarrinho,
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      console.log("Produto removido do carrinho:", produtoId);
      return res.status(200).json({ msg: "Produto removido do carrinho" });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro no carrinho:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
