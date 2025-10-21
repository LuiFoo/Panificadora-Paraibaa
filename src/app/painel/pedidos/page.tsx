"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import PedidoTimeline from "@/components/PedidoTimeline";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useUser } from "@/context/UserContext";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Pedido {
  _id: string;
  numeroPedido?: string; // Número sequencial (00001, 00002, etc.)
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
  usuario?: {
    nome: string;
    email: string;
    telefone: string;
  };
}

export default function PedidosPage() {
  const { isAdmin, loading } = useUser();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("ativos"); // Novo: mostrar apenas ativos por padrão
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<string>("urgente"); // Novo: ordenação por urgência
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
  const [autoRefresh, setAutoRefresh] = useState(true); // Novo: auto-refresh

  const fetchPedidos = useCallback(async () => {
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
  }, []);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;
    
    const interval = setInterval(() => {
      fetchPedidos();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isAdmin, fetchPedidos]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
      return;
    }
    
    if (isAdmin) {
      fetchPedidos();
    }
  }, [isAdmin, loading, router, fetchPedidos]);

  const handleStatusChange = async (pedidoId: string, novoStatus: string) => {
    try {
      const response = await fetch(`/api/admin/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`✅ Status atualizado para "${novoStatus}"!`);
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

  const handleAcaoRapida = (pedido: Pedido, acao: string) => {
    let novoStatus = "";
    let mensagem = "";

    switch (acao) {
      case "confirmar":
        novoStatus = "confirmado";
        mensagem = "Confirmar este pedido?";
        break;
      case "preparar":
        novoStatus = "preparando";
        mensagem = "Marcar como em preparo?";
        break;
      case "pronto":
        novoStatus = "pronto";
        mensagem = "Marcar como pronto?";
        break;
      case "entregar":
        novoStatus = "entregue";
        mensagem = "Marcar como entregue?";
        break;
      case "cancelar":
        novoStatus = "cancelado";
        mensagem = "⚠️ CANCELAR este pedido?";
        break;
    }

    setModalState({
      isOpen: true,
      type: acao === "cancelar" ? "warning" : "confirm",
      title: `Atualizar Pedido #${pedido.numeroPedido || pedido._id.slice(-6)}`,
      message: mensagem,
      onConfirm: () => {
        handleStatusChange(pedido._id, novoStatus);
        setModalState({ ...modalState, isOpen: false });
      }
    });
  };

  // Função de filtragem e ordenação
  const pedidosFiltrados = pedidos
    .filter(pedido => {
      // Filtro de status com lógica especial para "ativos"
      let matchStatus = true;
      if (filtroStatus === "ativos") {
        matchStatus = !['entregue', 'cancelado'].includes(pedido.status);
      } else if (filtroStatus !== "todos") {
        matchStatus = pedido.status === filtroStatus;
      }
      
      const matchModalidade = filtroModalidade === "todos" || pedido.modalidadeEntrega === filtroModalidade;
      return matchStatus && matchModalidade;
    })
    .sort((a, b) => {
      // Ordenação
      if (ordenacao === "urgente") {
        // Prioridade: pendente > confirmado > preparando > pronto > outros
        const prioridade: Record<string, number> = {
          'pendente': 1,
          'confirmado': 2,
          'preparando': 3,
          'pronto': 4,
          'entregue': 5,
          'cancelado': 6
        };
        const diff = (prioridade[a.status] || 99) - (prioridade[b.status] || 99);
        if (diff !== 0) return diff;
        // Se mesmo status, mais recente primeiro
        return new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime();
      } else if (ordenacao === "recente") {
        return new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime();
      } else if (ordenacao === "antigo") {
        return new Date(a.dataPedido).getTime() - new Date(b.dataPedido).getTime();
      } else if (ordenacao === "valor") {
        return b.total - a.total;
      }
      return 0;
    });

  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;
  const pedidosConfirmados = pedidos.filter(p => p.status === 'confirmado').length;
  const pedidosPreparando = pedidos.filter(p => p.status === 'preparando').length;
  const pedidosPronto = pedidos.filter(p => p.status === 'pronto').length;
  const totalHoje = pedidos
    .filter(p => {
      const hoje = new Date().toLocaleDateString('pt-BR');
      const dataPedido = new Date(p.dataPedido).toLocaleDateString('pt-BR');
      return hoje === dataPedido;
    })
    .reduce((sum, p) => sum + p.total, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmado': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparando': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'pronto': return 'bg-green-100 text-green-800 border-green-300';
      case 'entregue': return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return '⏳';
      case 'confirmado': return '✅';
      case 'preparando': return '👨‍🍳';
      case 'pronto': return '🍞';
      case 'entregue': return '✔️';
      case 'cancelado': return '❌';
      default: return '📦';
    }
  };

  const formatarData = (data: string) => {
    const d = new Date(data);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const dataStr = d.toLocaleDateString('pt-BR');
    const hojeStr = hoje.toLocaleDateString('pt-BR');
    const ontemStr = ontem.toLocaleDateString('pt-BR');

    if (dataStr === hojeStr) {
      return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dataStr === ontemStr) {
      return `Ontem às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `${dataStr} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
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

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <BreadcrumbNav 
          items={[
            { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
            { label: "Pedidos", icon: "📦", color: "purple" }
          ]}
        />
        
        {/* Cabeçalho Melhorado */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🍞 Pedidos da Padaria</h1>
              <p className="text-purple-100">Gerencie todos os pedidos em tempo real</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchPedidos}
                disabled={loadingPedidos}
                className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
              >
                <svg className={`w-5 h-5 ${loadingPedidos ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loadingPedidos ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                  autoRefresh 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-white text-purple-700 hover:bg-purple-50'
                }`}
              >
                {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
              </button>
              <Link
                href="/painel"
                className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-900 transition-colors flex items-center gap-2 font-medium"
              >
                ← Voltar
              </Link>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700 font-medium">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Estatísticas Aprimoradas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">⏳</span>
              <span className="text-2xl font-bold text-yellow-600">{pedidosPendentes}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">PENDENTES</p>
            {pedidosPendentes > 0 && (
              <p className="text-xs text-yellow-600 mt-1">🔔 Requer atenção!</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✅</span>
              <span className="text-2xl font-bold text-blue-600">{pedidosConfirmados}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">CONFIRMADOS</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">👨‍🍳</span>
              <span className="text-2xl font-bold text-purple-600">{pedidosPreparando}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">PREPARANDO</p>
            {pedidosPreparando > 0 && (
              <p className="text-xs text-purple-600 mt-1">🔥 Em produção</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🍞</span>
              <span className="text-2xl font-bold text-green-600">{pedidosPronto}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">PRONTOS</p>
            {pedidosPronto > 0 && (
              <p className="text-xs text-green-600 mt-1">📦 Para entrega!</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-400 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📦</span>
              <span className="text-2xl font-bold text-gray-700">{totalPedidos}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">TOTAL</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">💰</span>
              <span className="text-lg font-bold text-emerald-600">R$ {totalHoje.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">HOJE</p>
          </div>
        </div>

        {/* Filtros e Ordenação Melhorados */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtros e Ordenação</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
              >
                <option value="ativos">🔥 Ativos (Pendentes + Preparando)</option>
                <option value="todos">Todos os Status</option>
                <option value="pendente">⏳ Pendentes</option>
                <option value="confirmado">✅ Confirmados</option>
                <option value="preparando">👨‍🍳 Preparando</option>
                <option value="pronto">🍞 Prontos</option>
                <option value="entregue">✔️ Entregues</option>
                <option value="cancelado">❌ Cancelados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modalidade</label>
              <select
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
              >
                <option value="todos">Todas</option>
                <option value="entrega">🚚 Entrega</option>
                <option value="retirada">🏪 Retirada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
              >
                <option value="urgente">🔥 Mais Urgente</option>
                <option value="recente">🕐 Mais Recente</option>
                <option value="antigo">⏰ Mais Antigo</option>
                <option value="valor">💰 Maior Valor</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <p>
              <strong>{pedidosFiltrados.length}</strong> pedido(s) encontrado(s)
            </p>
            {autoRefresh && (
              <p className="text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Atualização automática ativa
              </p>
            )}
          </div>
        </div>

        {/* Lista de Pedidos Melhorada */}
        <div className="space-y-4">
          {loadingPedidos ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando pedidos...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-gray-400 text-7xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou aguarde novos pedidos</p>
            </div>
          ) : (
            pedidosFiltrados.map((pedido) => {
              const isUrgente = pedido.status === 'pendente' || pedido.status === 'preparando';
              
              return (
                <div 
                  key={pedido._id} 
                  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden ${
                    isUrgente ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  {isUrgente && (
                    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 font-bold text-sm flex items-center gap-2">
                      <span className="animate-pulse">🔔</span>
                      {pedido.status === 'pendente' ? 'NOVO PEDIDO - AGUARDANDO CONFIRMAÇÃO' : 'EM PREPARO - ATENÇÃO'}
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Cabeçalho do Card */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-white text-xl font-bold">#{pedido.numeroPedido || pedido._id.slice(-4)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">
                              Pedido #{pedido.numeroPedido || pedido._id.slice(-6)}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getStatusColor(pedido.status)}`}>
                              {getStatusIcon(pedido.status)} {pedido.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              🕐 {formatarData(pedido.dataPedido)}
                            </span>
                            <span className="flex items-center gap-1">
                              {pedido.modalidadeEntrega === 'entrega' ? '🚚' : '🏪'} {pedido.modalidadeEntrega === 'entrega' ? 'ENTREGA' : 'RETIRADA'}
                            </span>
                            {pedido.dataRetirada && pedido.horaRetirada && (
                              <span className="flex items-center gap-1 text-orange-600 font-medium">
                                ⏰ {new Date(pedido.dataRetirada).toLocaleDateString('pt-BR')} às {pedido.horaRetirada}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">R$ {pedido.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{pedido.produtos.length} item(s)</p>
                      </div>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                        👤 Cliente
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {pedido.usuario?.nome && (
                          <p><strong>Nome:</strong> {pedido.usuario.nome}</p>
                        )}
                        {pedido.telefone && (
                          <p className="flex items-center gap-1">
                            <strong>📞 Telefone:</strong> 
                            <a href={`tel:${pedido.telefone}`} className="text-blue-600 hover:underline font-medium">
                              {pedido.telefone}
                            </a>
                          </p>
                        )}
                        {pedido.endereco && (
                          <p className="md:col-span-2">
                            <strong>📍 Endereço:</strong> {pedido.endereco.rua}, {pedido.endereco.numero} - {pedido.endereco.bairro}, {pedido.endereco.cidade}
                            {pedido.endereco.cep && ` - CEP: ${pedido.endereco.cep}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Produtos do Pedido */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        🛒 Produtos ({pedido.produtos.length})
                      </h4>
                      <div className="space-y-2">
                        {pedido.produtos.map((produto, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{produto.nome}</p>
                              <p className="text-sm text-gray-500">
                                {produto.quantidade}x · R$ {produto.valor.toFixed(2)} cada
                              </p>
                            </div>
                            <p className="font-bold text-blue-600">
                              R$ {(produto.valor * produto.quantidade).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observações */}
                    {pedido.observacoes && (
                      <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                          📝 Observações do Cliente
                        </h4>
                        <p className="text-sm text-gray-700 italic">&ldquo;{pedido.observacoes}&rdquo;</p>
                      </div>
                    )}

                    {/* Ações Rápidas */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPedidoSelecionado(pedido)}
                        className="flex-1 min-w-[120px] px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        👁️ Ver Detalhes
                      </button>

                      {pedido.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleAcaoRapida(pedido, 'confirmar')}
                            className="flex-1 min-w-[120px] px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold flex items-center justify-center gap-2"
                          >
                            ✅ CONFIRMAR
                          </button>
                          <button
                            onClick={() => handleAcaoRapida(pedido, 'cancelar')}
                            className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                          >
                            ❌
                          </button>
                        </>
                      )}

                      {pedido.status === 'confirmado' && (
                        <button
                          onClick={() => handleAcaoRapida(pedido, 'preparar')}
                          className="flex-1 min-w-[120px] px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                          👨‍🍳 INICIAR PREPARO
                        </button>
                      )}

                      {pedido.status === 'preparando' && (
                        <button
                          onClick={() => handleAcaoRapida(pedido, 'pronto')}
                          className="flex-1 min-w-[120px] px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                          🍞 MARCAR PRONTO
                        </button>
                      )}

                      {pedido.status === 'pronto' && (
                        <button
                          onClick={() => handleAcaoRapida(pedido, 'entregar')}
                          className="flex-1 min-w-[120px] px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-bold flex items-center justify-center gap-2"
                        >
                          {pedido.modalidadeEntrega === 'entrega' ? '🚚 ENTREGUE' : '✅ RETIRADO'}
                        </button>
                      )}

                      {/* Dropdown de status para casos específicos */}
                      {!['entregue', 'cancelado'].includes(pedido.status) && (
                        <select
                          onChange={(e) => {
                            if (e.target.value !== pedido.status) {
                              handleStatusChange(pedido._id, e.target.value);
                            }
                          }}
                          value={pedido.status}
                          className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium bg-white hover:border-purple-400 transition-colors"
                        >
                          <option value="pendente">⏳ Pendente</option>
                          <option value="confirmado">✅ Confirmado</option>
                          <option value="preparando">👨‍🍳 Preparando</option>
                          <option value="pronto">🍞 Pronto</option>
                          <option value="entregue">✔️ Entregue</option>
                          <option value="cancelado">❌ Cancelado</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <Footer showMap={false} />

      {/* Modal de Detalhes Melhorado */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    📦 Pedido #{pedidoSelecionado.numeroPedido || pedidoSelecionado._id.slice(-6)}
                  </h2>
                  <p className="text-purple-100">
                    {formatarData(pedidoSelecionado.dataPedido)}
                  </p>
                </div>
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Timeline do Pedido */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">📊 Status do Pedido</h3>
                <PedidoTimeline 
                  statusAtual={pedidoSelecionado.status}
                  modalidade={pedidoSelecionado.modalidadeEntrega}
                  historico={pedidoSelecionado.historico}
                />
              </div>

              {/* Informações Detalhadas do Cliente */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">👤 Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pedidoSelecionado.usuario?.nome && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Nome</p>
                      <p className="text-gray-800 font-semibold">{pedidoSelecionado.usuario.nome}</p>
                    </div>
                  )}
                  {pedidoSelecionado.telefone && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Telefone</p>
                      <a 
                        href={`tel:${pedidoSelecionado.telefone}`}
                        className="text-blue-600 hover:underline font-bold text-lg"
                      >
                        📞 {pedidoSelecionado.telefone}
                      </a>
                    </div>
                  )}
                  {pedidoSelecionado.modalidadeEntrega === 'entrega' && pedidoSelecionado.endereco && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 font-medium mb-1">Endereço de Entrega</p>
                      <p className="text-gray-800 font-semibold">
                        {pedidoSelecionado.endereco.rua}, {pedidoSelecionado.endereco.numero}
                        {pedidoSelecionado.endereco.complemento && ` - ${pedidoSelecionado.endereco.complemento}`}
                      </p>
                      <p className="text-gray-600">
                        {pedidoSelecionado.endereco.bairro} - {pedidoSelecionado.endereco.cidade}
                        {pedidoSelecionado.endereco.cep && ` · CEP: ${pedidoSelecionado.endereco.cep}`}
                      </p>
                    </div>
                  )}
                  {pedidoSelecionado.modalidadeEntrega === 'retirada' && pedidoSelecionado.dataRetirada && (
                    <div className="md:col-span-2 bg-orange-100 rounded-lg p-3 border-2 border-orange-300">
                      <p className="text-sm text-orange-700 font-medium mb-1">🏪 Retirada Agendada</p>
                      <p className="text-orange-900 font-bold text-lg">
                        {new Date(pedidoSelecionado.dataRetirada).toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          day: '2-digit', 
                          month: 'long' 
                        })} às {pedidoSelecionado.horaRetirada}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista Detalhada de Produtos */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">🛒 Produtos do Pedido</h3>
                <div className="space-y-3">
                  {pedidoSelecionado.produtos.map((produto, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border-2 border-green-200 hover:border-green-400 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">{produto.nome}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-600">
                              <strong>Quantidade:</strong> {produto.quantidade}x
                            </span>
                            <span className="text-sm text-gray-600">
                              <strong>Preço unitário:</strong> R$ {produto.valor.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            R$ {(produto.valor * produto.quantidade).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">TOTAL DO PEDIDO</span>
                      <span className="text-3xl font-bold">R$ {pedidoSelecionado.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações Detalhadas */}
              {pedidoSelecionado.observacoes && (
                <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-300">
                  <h3 className="font-bold text-amber-800 mb-3 text-lg flex items-center gap-2">
                    📝 Observações do Cliente
                  </h3>
                  <p className="text-gray-700 bg-white rounded-lg p-4 border border-amber-200 italic">
                    &ldquo;{pedidoSelecionado.observacoes}&rdquo;
                  </p>
                </div>
              )}

              {/* Ações no Modal */}
              <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-bold"
                >
                  Fechar
                </button>
                {!['entregue', 'cancelado'].includes(pedidoSelecionado.status) && (
                  <button
                    onClick={() => {
                      const statusMap: Record<string, string> = {
                        'pendente': 'confirmado',
                        'confirmado': 'preparando',
                        'preparando': 'pronto',
                        'pronto': 'entregue'
                      };
                      const proximoStatus = statusMap[pedidoSelecionado.status];
                      
                      if (proximoStatus) {
                        handleStatusChange(pedidoSelecionado._id, proximoStatus);
                        setPedidoSelecionado(null);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-bold shadow-lg"
                  >
                    ➡️ Avançar Status
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
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
