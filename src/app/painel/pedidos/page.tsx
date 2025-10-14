"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import PedidoTimeline from "@/components/PedidoTimeline";
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
  historico?: Array<{
    status: string;
    data: string;
  }>;
}

export default function PedidosPage() {
  const { isAdmin, loading } = useUser();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todos");
  const [buscaTexto, setBuscaTexto] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "info" | "warning" | "error" | "success" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });
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
        
        // Disparar evento para atualizar o badge no Header
        window.dispatchEvent(new Event('refreshPedidosCount'));
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
        setModalState({
          isOpen: true,
          type: "error",
          title: "Erro",
          message: data.error || "Erro desconhecido ao atualizar status"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Erro de Conexão",
        message: "Erro de conexão. Tente novamente."
      });
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

  const filteredPedidos = pedidos.filter(pedido => {
    // Filtro de status
    const matchStatus = filtroStatus === "todos" || pedido.status === filtroStatus;
    
    // Filtro de modalidade
    const matchModalidade = filtroModalidade === "todos" || pedido.modalidadeEntrega === filtroModalidade;
    
    // Filtro de busca (ID, userId, produto ou telefone)
    const matchBusca = !buscaTexto || 
      pedido._id.includes(buscaTexto) ||
      pedido.userId.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      pedido.telefone?.includes(buscaTexto) ||
      pedido.produtos.some(p => p.nome.toLowerCase().includes(buscaTexto.toLowerCase()));
    
    return matchStatus && matchModalidade && matchBusca;
  });

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

        {/* Filtros Avançados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔍</span>
            Filtros Avançados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar:
              </label>
              <input
                type="text"
                placeholder="ID, cliente, produto ou telefone..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status:
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="todos">Todos</option>
                <option value="pendente">⏳ Pendentes</option>
                <option value="confirmado">✅ Confirmados</option>
                <option value="preparando">👨‍🍳 Preparando</option>
                <option value="pronto">🍞 Prontos</option>
                <option value="entregue">✨ Entregues</option>
                <option value="cancelado">❌ Cancelados</option>
              </select>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade:
              </label>
              <select
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="todos">Todas</option>
                <option value="entrega">🚚 Entrega</option>
                <option value="retirada">🏪 Retirada</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong>{filteredPedidos.length}</strong> {filteredPedidos.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
            </p>
            {(buscaTexto || filtroStatus !== "todos" || filtroModalidade !== "todos") && (
              <button
                onClick={() => {
                  setBuscaTexto("");
                  setFiltroStatus("todos");
                  setFiltroModalidade("todos");
                }}
                className="text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1"
              >
                🔄 Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            filteredPedidos.map((pedido) => (
              <div key={pedido._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* Cabeçalho do Pedido */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold">Pedido #{pedido._id.slice(-6)}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                        </span>
                        {pedido.modalidadeEntrega === 'entrega' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">🚚 Entrega</span>
                        )}
                        {pedido.modalidadeEntrega === 'retirada' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">🏪 Retirada</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <p>👤 <strong>Cliente:</strong> {pedido.userId}</p>
                        <p>📅 {new Date(pedido.dataPedido).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        <p>📞 {pedido.telefone}</p>
                        <p>📦 {pedido.produtos.length} {pedido.produtos.length === 1 ? 'item' : 'itens'}</p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-amber-600">
                        R$ {pedido.total.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação Rápida */}
                  <div className="flex gap-2 flex-wrap">
                    {pedido.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => updateStatus(pedido._id, 'confirmado')}
                          disabled={updatingStatus === pedido._id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          ✅ Confirmar
                        </button>
                        <button
                          onClick={() => updateStatus(pedido._id, 'cancelado')}
                          disabled={updatingStatus === pedido._id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          ❌ Cancelar
                        </button>
                      </>
                    )}
                    {pedido.status === 'confirmado' && (
                      <button
                        onClick={() => updateStatus(pedido._id, 'preparando')}
                        disabled={updatingStatus === pedido._id}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        👨‍🍳 Iniciar Preparo
                      </button>
                    )}
                    {pedido.status === 'preparando' && (
                      <button
                        onClick={() => updateStatus(pedido._id, 'pronto')}
                        disabled={updatingStatus === pedido._id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        🍞 Marcar como Pronto
                      </button>
                    )}
                    {pedido.status === 'pronto' && (
                      <button
                        onClick={() => updateStatus(pedido._id, 'entregue')}
                        disabled={updatingStatus === pedido._id}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        ✨ Marcar como Entregue
                      </button>
                    )}
                    <button
                      onClick={() => setPedidoExpandido(pedidoExpandido === pedido._id ? null : pedido._id)}
                      className="ml-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                    >
                      {pedidoExpandido === pedido._id ? '▲ Recolher Detalhes' : '▼ Ver Detalhes'}
                    </button>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {pedidoExpandido === pedido._id && (
                  <div className="p-6 space-y-4 bg-gray-50">
                    {/* Timeline */}
                    <PedidoTimeline 
                      statusAtual={pedido.status}
                      modalidade={pedido.modalidadeEntrega}
                      historico={pedido.historico}
                    />

                    {/* Produtos */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="font-medium mb-3 text-gray-800 flex items-center gap-2">
                        <span>🛍️</span>
                        Produtos do Pedido
                      </h4>
                      <div className="space-y-2">
                        {pedido.produtos.map((produto, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">{produto.nome}</span>
                              <span className="text-sm text-gray-500 ml-2">x{produto.quantidade}</span>
                            </div>
                            <span className="font-semibold text-gray-800">
                              R$ {(produto.valor * produto.quantidade).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t-2 border-gray-300 flex justify-between items-center">
                          <span className="font-bold text-gray-800">Total:</span>
                          <span className="font-bold text-xl text-amber-600">
                            R$ {pedido.total.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Endereço - apenas para entrega */}
                    {pedido.modalidadeEntrega === 'entrega' && pedido.endereco && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-green-900 flex items-center gap-2">
                          <span>🚚</span>
                          Endereço de Entrega
                        </h4>
                        <div className="text-sm text-green-800 space-y-1">
                          <p><strong>Rua:</strong> {pedido.endereco.rua}, {pedido.endereco.numero}</p>
                          <p><strong>Bairro:</strong> {pedido.endereco.bairro}</p>
                          <p><strong>Cidade:</strong> {pedido.endereco.cidade}</p>
                          <p><strong>CEP:</strong> {pedido.endereco.cep}</p>
                          {pedido.endereco.complemento && (
                            <p><strong>Complemento:</strong> {pedido.endereco.complemento}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informação de Retirada */}
                    {pedido.modalidadeEntrega === 'retirada' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-blue-900 flex items-center gap-2">
                          <span>🏪</span>
                          Retirada no Local
                        </h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>Cliente deve retirar na panificadora</p>
                          {pedido.dataRetirada && pedido.horaRetirada && (
                            <p className="font-medium mt-2">
                              <strong>📅 Data e Hora:</strong> {new Date(pedido.dataRetirada + 'T' + pedido.horaRetirada).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    {pedido.observacoes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-yellow-900 flex items-center gap-2">
                          <span>📝</span>
                          Observações do Cliente
                        </h4>
                        <p className="text-sm text-yellow-800">{pedido.observacoes}</p>
                      </div>
                    )}

                    {/* Controle Manual de Status */}
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-gray-800 flex items-center gap-2">
                        <span>⚙️</span>
                        Controle Manual de Status
                      </h4>
                      <div className="flex gap-2 flex-wrap items-center">
                        <select
                          value={pedido.status}
                          onChange={(e) => updateStatus(pedido._id, e.target.value)}
                          disabled={updatingStatus === pedido._id}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="pendente">⏳ Pendente</option>
                          <option value="confirmado">✅ Confirmado</option>
                          <option value="preparando">👨‍🍳 Preparando</option>
                          <option value="pronto">🍞 Pronto</option>
                          <option value="entregue">✨ Entregue</option>
                          <option value="cancelado">❌ Cancelado</option>
                        </select>
                        
                        {updatingStatus === pedido._id && (
                          <div className="flex items-center text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500 mr-2"></div>
                            Atualizando...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      <Footer showMap={false} />

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </>
  );
}
