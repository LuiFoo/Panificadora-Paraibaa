"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Pedido {
  _id: string;
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
  dataPedido: string;
  ultimaAtualizacao: string;
}

export default function MeusPedidosPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPedidos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPedidos = async () => {
    try {
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(user?.login || "")}`);
      if (response.ok) {
        const data = await response.json();
        setPedidos(data.pedidos || []);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparando': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pronto': return 'bg-green-100 text-green-800 border-green-200';
      case 'entregue': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return '⏳ Pendente';
      case 'confirmado': return '✅ Confirmado';
      case 'preparando': return '👨‍🍳 Preparando';
      case 'pronto': return '🍞 Pronto';
      case 'entregue': return '🚚 Entregue';
      case 'cancelado': return '❌ Cancelado';
      default: return status;
    }
  };

  const getModalidadeText = (modalidade: string) => {
    return modalidade === 'entrega' ? '🚚 Entrega' : '🏪 Retirada';
  };

  const filteredPedidos = pedidos.filter(pedido => 
    filtroStatus === "todos" || pedido.status === filtroStatus
  );

  if (loading || loadingPedidos) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Carregando seus pedidos...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-red-600 text-lg">Você precisa estar logado para ver seus pedidos.</p>
          <Link href="/login" className="mt-4 inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold">
            Fazer Login
          </Link>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Meus Pedidos</h1>
            <p className="text-gray-600 mt-1">Acompanhe o status dos seus pedidos</p>
          </div>
          <Link 
            href="/carrinho" 
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🛒 Ver Carrinho
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Status:
          </label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="todos">Todos os Pedidos</option>
            <option value="pendente">Pendentes</option>
            <option value="confirmado">Confirmados</option>
            <option value="preparando">Preparando</option>
            <option value="pronto">Prontos</option>
            <option value="entregue">Entregues</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-600 mb-4">
                {filtroStatus === "todos" 
                  ? "Você ainda não fez nenhum pedido." 
                  : "Nenhum pedido com este status."
                }
              </p>
              <Link
                href="/produtos"
                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Ver Produtos
              </Link>
            </div>
          ) : (
            filteredPedidos.map((pedido) => (
              <div key={pedido._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Pedido #{pedido._id.slice(-6)}</h3>
                    <p className="text-sm text-gray-600">
                      Data: {new Date(pedido.dataPedido).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Modalidade: {getModalidadeText(pedido.modalidadeEntrega)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(pedido.status)}`}>
                      {getStatusText(pedido.status)}
                    </span>
                    <p className="text-lg font-bold mt-2">
                      R$ {pedido.total.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>

                {/* Produtos */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Produtos:</h4>
                  <div className="space-y-1">
                    {pedido.produtos.map((produto, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{produto.nome} x{produto.quantidade}</span>
                        <span>R$ {(produto.valor * produto.quantidade).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Endereço - apenas para entrega */}
                {pedido.modalidadeEntrega === 'entrega' && pedido.endereco && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-1">Endereço de Entrega:</h4>
                    <p className="text-sm text-gray-600">
                      {pedido.endereco.rua}, {pedido.endereco.numero} - {pedido.endereco.bairro}
                    </p>
                    <p className="text-sm text-gray-600">
                      {pedido.endereco.cidade} - CEP: {pedido.endereco.cep}
                    </p>
                    {pedido.endereco.complemento && (
                      <p className="text-sm text-gray-600">
                        {pedido.endereco.complemento}
                      </p>
                    )}
                  </div>
                )}

                {/* Informação de Retirada */}
                {pedido.modalidadeEntrega === 'retirada' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium mb-1 text-blue-900">Retirada no Local:</h4>
                    <p className="text-sm text-blue-800">
                      Retire seu pedido na panificadora
                    </p>
                    {pedido.dataRetirada && pedido.horaRetirada && (
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>Data e Hora:</strong> {new Date(pedido.dataRetirada + 'T' + pedido.horaRetirada).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}

                {/* Observações */}
                {pedido.observacoes && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-1">Observações:</h4>
                    <p className="text-sm text-gray-600">{pedido.observacoes}</p>
                  </div>
                )}

                {/* Informações de Contato */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Telefone:</strong> {pedido.telefone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Última atualização:</strong> {new Date(pedido.ultimaAtualizacao).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer showMap={false} />
    </>
  );
}
