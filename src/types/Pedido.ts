// Interface unificada para pedidos
export interface ProdutoPedido {
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
  img?: string; // Opcional para compatibilidade
}

export interface Pedido {
  _id: string;
  numeroPedido?: string; // Número sequencial (00001, 00002, etc.)
  userId?: string; // Opcional para compatibilidade (presente no painel admin)
  produtos: ProdutoPedido[];
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
  dataPedido: string;
  ultimaAtualizacao: string;
  historico?: Array<{
    status: string;
    data: string;
  }>;
  usuario?: {
    nome: string;
    email: string;
    telefone: string;
  };
}





