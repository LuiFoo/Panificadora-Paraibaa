import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb"; // Conexão com MongoDB
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface ProdutoCarrinho {
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
  img?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  // Autenticar e extrair login do usuário
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  
  // Tentar diferentes formas de obter o login
  let login = (session.user as { login?: string }).login;
  
  // Se não tem login na sessão, buscar no banco pelo email
  if (!login) {
    try {
      const client = await clientPromise;
      const db = client.db("paraiba");
      const user = await db.collection("users").findOne({ 
        email: session.user.email 
      });
      if (user) {
        login = user.login;
      }
    } catch (error) {
      console.error("Erro ao buscar login do usuário:", error);
    }
  }
  
  // Fallback para email se ainda não tem login
  if (!login) {
    login = session.user.email || undefined;
  }

  logger.dev("Login recebido:", login);
  logger.dev("Método:", method);
  logger.dev("Body recebido:", req.body);

  try {
    // Corrigindo a inicialização da variável client
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Buscar usuário por login ou email
    let user = await db.collection("users").findOne({ login });
    if (!user) {
      // Se não encontrou por login, tentar por email
      user = await db.collection("users").findOne({ email: session.user.email });
    }
    
    if (!user) {
      console.error("Usuário não encontrado. Login:", login, "Email:", session.user.email);
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
      logger.dev("Dados recebidos na API:", { produtoId, nome, valor, quantidade, img });

      if (!produtoId || !nome || !valor || quantidade <= 0) {
        logger.dev("Dados inválidos:", { produtoId, nome, valor, quantidade });
        return res.status(400).json({ error: "Dados inválidos para adicionar produto" });
      }

      logger.dev("Carrinho atual do usuário:", user.carrinho.produtos);
      const existingProductIndex = user.carrinho.produtos.findIndex(
        (item: ProdutoCarrinho) => item.produtoId === produtoId
      );

      logger.dev("Índice do produto existente:", existingProductIndex);

      if (existingProductIndex > -1) {
        logger.dev("Produto já existe, substituindo quantidade de", user.carrinho.produtos[existingProductIndex].quantidade, "para", quantidade);
        user.carrinho.produtos[existingProductIndex].quantidade = quantidade;
      } else {
        logger.dev("Novo produto, adicionando ao carrinho");
        user.carrinho.produtos.push({ produtoId, nome, valor, quantidade, img });
      }

      await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $set: { 
            "carrinho.produtos": user.carrinho.produtos,
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      logger.dev("Carrinho atualizado no MongoDB:", user.carrinho.produtos);
      return res.status(200).json({ 
        msg: "Produto adicionado ou atualizado no carrinho",
        produtos: user.carrinho.produtos 
      });
    }

    if (method === "PUT") {
      const { produtoId, quantidade, produtos } = req.body;
      logger.dev("Atualizando carrinho - produtoId:", produtoId, "quantidade:", quantidade, "produtos:", produtos);

      // Se produtos foi enviado, atualizar todo o carrinho (para remoção de produtos pausados)
      if (produtos && Array.isArray(produtos)) {
        logger.dev("Atualizando carrinho completo com produtos:", produtos);
        await db.collection("users").updateOne(
          { _id: user._id },
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
        logger.dev("Dados inválidos para atualização:", { produtoId, quantidade });
        return res.status(400).json({ error: "Dados inválidos para atualização" });
      }

      logger.dev("Carrinho antes da atualização:", user.carrinho.produtos);
      const updatedCarrinho = user.carrinho.produtos.map((item: ProdutoCarrinho) =>
        item.produtoId === produtoId ? { ...item, quantidade } : item
      );
      logger.dev("Carrinho após atualização:", updatedCarrinho);

      await db.collection("users").updateOne(
        { _id: user._id },
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
      logger.dev("Limpando carrinho completo para usuário:", login);
      logger.dev("Carrinho antes da limpeza:", user.carrinho.produtos);
      
      const updateResult = await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $set: { 
            "carrinho.produtos": [],
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      logger.dev("Resultado da atualização:", updateResult);
      logger.dev("Carrinho limpo no MongoDB para usuário:", login);
      return res.status(200).json({ msg: "Carrinho limpo com sucesso" });
    }

    // Remover produto específico
    if (method === "DELETE") {
      const { produtoId } = req.body;
      logger.dev("Removendo produto específico:", produtoId);

      if (!produtoId) {
        logger.dev("ProdutoId não fornecido para remoção");
        return res.status(400).json({ error: "ProdutoId é necessário para remoção" });
      }

      const updatedCarrinho = user.carrinho.produtos.filter(
        (item: ProdutoCarrinho) => item.produtoId !== produtoId
      );

      await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $set: { 
            "carrinho.produtos": updatedCarrinho,
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      logger.dev("Produto removido do carrinho:", produtoId);
      return res.status(200).json({ msg: "Produto removido do carrinho" });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    logger.error("Erro no carrinho:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
