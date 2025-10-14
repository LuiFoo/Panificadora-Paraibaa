import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/modules/mongodb";

interface Pedido {
  _id?: string;
  userId: string;
  produtos: Array<{
    produtoId: string;
    nome: string;
    valor: number;
    quantidade: number;
    img?: string;
  }>;
  total: number;
  status: 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  modalidadeEntrega: 'entrega' | 'retirada';
  endereco?: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    cep: string;
    complemento?: string;
  };
  dataRetirada?: string;
  horaRetirada?: string;
  telefone?: string;
  observacoes?: string;
  dataPedido: Date;
  ultimaAtualizacao: Date;
}

// Configurações de limite
const MAX_ORDER_VALUE = 500; // Máximo R$ 500 por pedido

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const userId = req.query.userId as string;

  if (!userId || userId === "guest") {
    return res.status(401).json({ error: "Usuário deve estar logado para fazer pedidos" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("paraiba");

    // Verificar se usuário existe
    const user = await db.collection("users").findOne({ login: userId });
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

      // 3. Validar quantidade total de itens
      const totalItens = produtos.reduce((sum: number, item: any) => sum + (item.quantidade || 0), 0);
      if (totalItens > 50) {
        return res.status(400).json({ error: "Máximo de 50 itens por pedido" });
      }

      // 4. Calcular total e validar valor
      const total = produtos.reduce((sum: number, item: any) => sum + (item.valor * item.quantidade), 0);
      if (total > MAX_ORDER_VALUE) {
        return res.status(400).json({ 
          error: `Valor máximo do pedido é R$ ${MAX_ORDER_VALUE}. Para pedidos maiores, entre em contato conosco.` 
        });
      }

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
      const novoPedido: Pedido = {
        userId,
        produtos,
        total,
        status: 'pendente',
        modalidadeEntrega,
        endereco: modalidadeEntrega === 'entrega' ? endereco : undefined,
        dataRetirada: modalidadeEntrega === 'retirada' ? dataRetirada : undefined,
        horaRetirada: modalidadeEntrega === 'retirada' ? horaRetirada : undefined,
        telefone,
        observacoes,
        dataPedido: new Date(),
        ultimaAtualizacao: new Date()
      };

      // Salvar no banco
      const result = await db.collection("pedidos").insertOne(novoPedido);

      // Limpar carrinho do usuário
      await db.collection("users").updateOne(
        { login: userId },
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
        .find({ userId })
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
