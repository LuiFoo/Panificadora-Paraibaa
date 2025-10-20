import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

interface ProdutoPedido {
  id: string;
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
  img?: string;
}

// Configurações de limite
// Limite de valor removido

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Autenticação via sessão NextAuth
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  const userLogin = (session.user as { login?: string }).login || session.user.id;

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Verificar se usuário existe via login/id da sessão
    const query: Record<string, unknown> = { 
      $or: [ 
        { login: userLogin }, 
        { email: session.user.email } 
      ] 
    };
    
    // Só adicionar _id se userLogin for um ObjectId válido
    if (userLogin && ObjectId.isValid(userLogin)) {
      (query.$or as Record<string, unknown>[]).push({ _id: new ObjectId(userLogin) });
    }
    
    const user = await db.collection("users").findOne(query);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (method === "POST") {
      const { produtos, modalidadeEntrega, endereco, dataRetirada, horaRetirada, telefone, observacoes } = req.body;

      // VALIDAÇÕES ANTI-SPAM
      
      // 1. Rate limiting diário removido - clientes podem fazer quantos pedidos quiserem

      // 2. Validar dados do pedido
      if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio" });
      }

      // Validar estrutura dos produtos
      for (const produto of produtos) {
        if (!produto.id || !produto.nome || typeof produto.valor !== 'number' || typeof produto.quantidade !== 'number') {
          return res.status(400).json({ error: "Estrutura de produto inválida" });
        }
        if (produto.valor <= 0 || produto.quantidade <= 0) {
          return res.status(400).json({ error: "Valor e quantidade devem ser maiores que zero" });
        }
        // Validar se o ID é um ObjectId válido
        if (!ObjectId.isValid(produto.id)) {
          return res.status(400).json({ error: "ID de produto inválido" });
        }
      }

      // 3. Limite total de itens por pedido removido

      // 4. Calcular total (limite de valor removido)
      const total = produtos.reduce((sum: number, item: ProdutoPedido) => sum + (item.valor * item.quantidade), 0);

      // 5. Validar modalidade de entrega
      if (!modalidadeEntrega || !['entrega', 'retirada'].includes(modalidadeEntrega)) {
        return res.status(400).json({ error: "Modalidade de entrega é obrigatória" });
      }

      // 6. Validar endereço (obrigatório apenas para entrega)
      if (modalidadeEntrega === 'entrega' && (!endereco || !endereco.rua || !endereco.numero || !endereco.bairro || !endereco.cidade)) {
        return res.status(400).json({ error: "Endereço completo é obrigatório para entrega" });
      }

      // 7. Validar data e hora de retirada (obrigatório apenas para retirada)
      if (modalidadeEntrega === 'retirada') {
        if (!dataRetirada || !horaRetirada) {
          return res.status(400).json({ error: "Data e hora de retirada são obrigatórias" });
        }

        // Validar se a data não é no passado
        const dataRetiradaObj = new Date(dataRetirada + 'T' + horaRetirada);
        const agora = new Date();
        if (dataRetiradaObj <= agora) {
          return res.status(400).json({ error: "Data e hora de retirada devem ser no futuro" });
        }

        // Validar horário de funcionamento (6h às 18h)
        const hora = parseInt(horaRetirada.split(':')[0]);
        if (hora < 6 || hora > 18) {
          return res.status(400).json({ error: "Horário de retirada deve ser entre 6h e 18h" });
        }
      }

      // 8. Validar telefone
      if (!telefone || telefone.length < 10) {
        return res.status(400).json({ error: "Telefone válido é obrigatório" });
      }

      // Criar pedido
      const dataAtual = new Date();
      const novoPedido = {
        userId: user.login || userLogin,
        produtos,
        total,
        status: 'pendente',
        modalidadeEntrega,
        endereco: modalidadeEntrega === 'entrega' ? endereco : undefined,
        dataRetirada: modalidadeEntrega === 'retirada' ? dataRetirada : undefined,
        horaRetirada: modalidadeEntrega === 'retirada' ? horaRetirada : undefined,
        telefone,
        observacoes,
        dataPedido: dataAtual,
        ultimaAtualizacao: dataAtual,
        historico: [
          {
            status: 'pendente',
            data: dataAtual
          }
        ]
      };

      // Salvar no banco
      const result = await db.collection("pedidos").insertOne(novoPedido);

      // Limpar carrinho do usuário
      await db.collection("users").updateOne(
        { login: user.login || userLogin },
        { 
          $set: { 
            "carrinho.produtos": [],
            "carrinho.updatedAt": new Date().toISOString()
          } 
        }
      );

      return res.status(201).json({ 
        success: true,
        pedidoId: result.insertedId,
        message: "Pedido realizado com sucesso! Aguarde a confirmação."
      });
    }

    if (method === "GET") {
      // Buscar pedidos do usuário
      const pedidos = await db.collection("pedidos")
        .find({ userId: user.login || userLogin })
        .sort({ dataPedido: -1 })
        .limit(10)
        .toArray();

      return res.status(200).json({ pedidos });
    }

    return res.status(405).json({ error: "Método não permitido" });

  } catch (error) {
    console.error("Erro na API de pedidos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
