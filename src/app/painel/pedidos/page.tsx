"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import PedidoTimeline from "@/components/PedidoTimeline";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
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
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPedidos = async () => {
    setLoadingPedidos(true);
    setError("");
    try {
      const response = await fetch("/api/admin/pedidos");
      const data = await response.json();
      
      if (data.success) {
        setPedidos(data.pedidos);
      } else {
        setError(data.error || "Erro ao carregar pedidos");
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoadingPedidos(false);
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
      return;
    }
    
    if (isAdmin) {
      fetchPedidos();
    }
  }, [isAdmin, loading, router]);

  const handleStatusChange = async (pedidoId: string, novoStatus: string) => {
    try {
      const response = await fetch(`/api/admin/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Status do pedido atualizado para ${novoStatus}!`);
        setTimeout(() => setSuccess(""), 3000);
        fetchPedidos();
      } else {
        setError(data.error || "Erro ao atualizar status do pedido");
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      setError("Erro ao conectar com o servidor");
    }
  };

  const handleDeletePedido = (pedido: Pedido) => {
    setModalState({
      isOpen: true,
      type: "warning",
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja deletar o pedido #${pedido._id.slice(-6)}? Esta ação não pode ser desfeita!`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/pedidos/${pedido._id}`, {
            method: "DELETE"
          });

          const data = await response.json();
          if (data.success) {
            setSuccess("Pedido deletado com sucesso!");
            setTimeout(() => setSuccess(""), 3000);
            fetchPedidos();
          } else {
            setError(data.error || "Erro ao deletar pedido");
          }
        } catch (err) {
          console.error("Erro ao deletar pedido:", err);
          setError("Erro ao conectar com o servidor");
        }
      }
    });
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchStatus = filtroStatus === "todos" || pedido.status === filtroStatus;
    const matchModalidade = filtroModalidade === "todos" || pedido.modalidadeEntrega === filtroModalidade;
    return matchStatus && matchModalidade;
  });

  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;
  const pedidosConfirmados = pedidos.filter(p => p.status === 'confirmado').length;
  const pedidosEntregues = pedidos.filter(p => p.status === 'entregue').length;
  const pedidosCancelados = pedidos.filter(p => p.status === 'cancelado').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'confirmado': return 'bg-blue-100 text-blue-800';
      case 'preparando': return 'bg-purple-100 text-purple-800';
      case 'pronto': return 'bg-green-100 text-green-800';
      case 'entregue': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return '⏳';
      case 'confirmado': return '✅';
      case 'preparando': return '👨‍🍳';
      case 'pronto': return '🍞';
      case 'entregue': return '🚚';
      case 'cancelado': return '❌';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loadingPedidos) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <div className="max-w-6xl mx-auto">
        <BreadcrumbNav 
          items={[
            { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
            { label: "Pedidos", icon: "📦", color: "red" }
          ]}
        />
        
        <div className="bg-white rounded-lg shadow-md">
          {/* Cabeçalho */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">Gerenciar Pedidos</h1>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      {totalPedidos} pedidos
                    </span>
                  </div>
                  <p className="text-gray-600">Visualize e gerencie todos os pedidos dos clientes</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/painel"
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar
                </Link>
                <button
                  onClick={fetchPedidos}
                  disabled={loadingPedidos}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumo dos Pedidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-800">{pedidosPendentes}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Confirmados</p>
                    <p className="text-2xl font-bold text-blue-800">{pedidosConfirmados}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Entregues</p>
                    <p className="text-2xl font-bold text-green-800">{pedidosEntregues}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🚚</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Cancelados</p>
                    <p className="text-2xl font-bold text-red-800">{pedidosCancelados}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">❌</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="todos">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="preparando">Preparando</option>
                  <option value="pronto">Pronto</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Modalidade</label>
                <select
                  value={filtroModalidade}
                  onChange={(e) => setFiltroModalidade(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="todos">Todas as modalidades</option>
                  <option value="entrega">Entrega</option>
                  <option value="retirada">Retirada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📦 Lista de Pedidos</h2>
            {pedidosFiltrados.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-gray-500 text-6xl mb-4">📦</div>
                <p className="text-gray-600 text-lg">Nenhum pedido encontrado</p>
                <p className="text-gray-500 text-sm">Tente ajustar os filtros</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidosFiltrados.map((pedido) => (
                  <div key={pedido._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">📦</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800">Pedido #{pedido._id.slice(-6)}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                              {getStatusIcon(pedido.status)} {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>
                              <p><strong>Modalidade:</strong> {pedido.modalidadeEntrega === 'entrega' ? '🚚 Entrega' : '🏪 Retirada'}</p>
                              <p><strong>Data:</strong> {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <p><strong>Produtos:</strong> {pedido.produtos.length} item(s)</p>
                              {pedido.telefone && <p><strong>Telefone:</strong> {pedido.telefone}</p>}
                              {pedido.endereco && (
                                <p><strong>Endereço:</strong> {pedido.endereco.rua}, {pedido.endereco.numero}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row gap-2">
                        <button
                          onClick={() => setPedidoSelecionado(pedido)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          👁️ Ver Detalhes
                        </button>
                        
                        {pedido.status !== 'entregue' && pedido.status !== 'cancelado' && (
                          <select
                            onChange={(e) => handleStatusChange(pedido._id, e.target.value)}
                            value={pedido.status}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="preparando">Preparando</option>
                            <option value="pronto">Pronto</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        )}
                        
                        <button
                          onClick={() => handleDeletePedido(pedido)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer showMap={false} />

      {/* Modal de Detalhes do Pedido */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Detalhes do Pedido #{pedidoSelecionado._id.slice(-6)}
                </h2>
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <PedidoTimeline 
                statusAtual={pedidoSelecionado.status}
                modalidade={pedidoSelecionado.modalidadeEntrega}
                historico={pedidoSelecionado.historico}
              />
            </div>
          </div>
        </div>
      )}

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
    </ProtectedRoute>
  );
}