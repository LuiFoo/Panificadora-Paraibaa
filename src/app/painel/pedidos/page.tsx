"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Pedido {
  _id: string;
  userId: string;
  produtos: Array<{
    produtoId: string;
    nome: string;
    valor: number;
    quantidade: number;
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

export default function PedidosPage() {
  const { isAdmin, loading } = useUser();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pedidosPendentes: 0,
    pedidosHoje: 0,
    valorTotal: 0
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchPedidos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchPedidos = async () => {
    try {
      const response = await fetch("/api/admin/pedidos");
      if (response.ok) {
        const data = await response.json();
        setPedidos(data.pedidos || []);
        calculateStats(data.pedidos || []);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const calculateStats = (pedidosList: Pedido[]) => {
    const hoje = new Date().toDateString();
    const pedidosHoje = pedidosList.filter(p => 
      new Date(p.dataPedido).toDateString() === hoje
    );
    
    setStats({
      totalPedidos: pedidosList.length,
      pedidosPendentes: pedidosList.filter(p => p.status === 'pendente').length,
      pedidosHoje: pedidosHoje.length,
      valorTotal: pedidosList.reduce((sum, p) => sum + p.total, 0)
    });
  };

  const updateStatus = async (pedidoId: string, novoStatus: string) => {
    setUpdatingStatus(pedidoId);
    
    try {
      console.log("Atualizando status do pedido:", pedidoId, "para:", novoStatus);
      
      const response = await fetch(`/api/admin/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Status atualizado com sucesso");
        fetchPedidos(); // Recarregar lista
      } else {
        console.error("Erro ao atualizar status:", data.error);
        alert(`Erro ao atualizar status: ${data.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'confirmado': return 'bg-blue-100 text-blue-800';
      case 'preparando': return 'bg-orange-100 text-orange-800';
      case 'pronto': return 'bg-green-100 text-green-800';
      case 'entregue': return 'bg-gray-100 text-gray-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPedidos = pedidos.filter(pedido => 
    filtroStatus === "todos" || pedido.status === filtroStatus
  );

  if (loading || loadingPedidos) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Carregando...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-10 text-center">
          <p className="text-red-600 text-lg">Acesso negado. Apenas administradores.</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
            <p className="text-gray-600 mt-1">Gerencie todos os pedidos da panificadora</p>
          </div>
          <Link 
            href="/painel" 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ← Voltar ao Painel
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total de Pedidos</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.totalPedidos}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">Pendentes</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.pedidosPendentes}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Hoje</h3>
            <p className="text-2xl font-bold text-green-900">{stats.pedidosHoje}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Valor Total</h3>
            <p className="text-2xl font-bold text-purple-900">
              R$ {stats.valorTotal.toFixed(2).replace(".", ",")}
            </p>
          </div>
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
            <option value="todos">Todos</option>
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
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            filteredPedidos.map((pedido) => (
              <div key={pedido._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Pedido #{pedido._id.slice(-6)}</h3>
                    <p className="text-sm text-gray-600">
                      Cliente: {pedido.userId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Data: {new Date(pedido.dataPedido).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Telefone: {pedido.telefone}
                    </p>
                    <p className="text-sm text-gray-600">
                      Modalidade: {pedido.modalidadeEntrega === 'entrega' ? '🚚 Entrega' : '🏪 Retirada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pedido.status)}`}>
                      {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
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
                      Cliente deve retirar na panificadora
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

                {/* Controles de Status */}
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={pedido.status}
                    onChange={(e) => updateStatus(pedido._id, e.target.value)}
                    disabled={updatingStatus === pedido._id}
                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="preparando">Preparando</option>
                    <option value="pronto">Pronto</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  
                  {updatingStatus === pedido._id && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500 mr-2"></div>
                      Atualizando...
                    </div>
                  )}
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
