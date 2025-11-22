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
import type { Pedido } from "@/types/Pedido";

export default function PedidosPage() {
  const { isAdmin, loading } = useUser();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("ativos"); // Novo: mostrar apenas ativos por padrão
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<string>("urgente"); // Novo: ordenação por urgência
  const [filtroData, setFiltroData] = useState<string>(""); // Filtro de data
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
      
      // 🐛 CORREÇÃO: Verificar se resposta é JSON válido antes de fazer parse
      let data;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          throw new Error("Resposta não é JSON");
        }
      } catch (jsonError) {
        console.error("Erro ao parsear JSON:", jsonError);
        setError("Erro ao processar resposta do servidor");
        return;
      }
      
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
      
      // Filtro de data (data de entrega/coleta)
      let matchData = true;
      if (filtroData) {
        // Usar dataRetirada (que representa data de entrega/coleta agendada) se disponível
        // Caso contrário, usar dataPedido como fallback
        const dataEntregaColeta = pedido.dataRetirada || pedido.dataPedido;
        
        if (!dataEntregaColeta) {
          matchData = false;
        } else {
          // Parsear a data do filtro (formato YYYY-MM-DD)
          const [anoFiltro, mesFiltro, diaFiltro] = filtroData.split('-').map(Number);
          
          // Parsear a data de entrega/coleta
          const dataEntregaColetaObj = new Date(dataEntregaColeta);
          
          // Normalizar ambas as datas para o timezone local (meia-noite)
          const dataFiltroNormalizada = new Date(anoFiltro, mesFiltro - 1, diaFiltro, 0, 0, 0, 0);
          const dataEntregaColetaNormalizada = new Date(
            dataEntregaColetaObj.getFullYear(),
            dataEntregaColetaObj.getMonth(),
            dataEntregaColetaObj.getDate(),
            0, 0, 0, 0
          );
          
          // Comparar apenas dia, mês e ano (ignorar hora e timezone)
          matchData = 
            dataFiltroNormalizada.getFullYear() === dataEntregaColetaNormalizada.getFullYear() &&
            dataFiltroNormalizada.getMonth() === dataEntregaColetaNormalizada.getMonth() &&
            dataFiltroNormalizada.getDate() === dataEntregaColetaNormalizada.getDate();
        }
      }
      
      return matchStatus && matchModalidade && matchData;
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
      <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <BreadcrumbNav 
            items={[
              { label: "Painel Administrativo", href: "/painel", icon: "🏠", color: "blue" },
              { label: "Pedidos", icon: "📦", color: "purple" }
            ]}
          />
          
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[var(--color-avocado-600)] via-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-3xl shadow-2xl p-6 md:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                    <span className="text-3xl md:text-4xl">📦</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                        Pedidos da Padaria
                      </h1>
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-bold rounded-full border border-white/30 shadow-lg">
                        Admin
                      </span>
                    </div>
                    <p className="text-white/90 text-sm md:text-base lg:text-lg">
                      Gerencie todos os pedidos em tempo real
                    </p>
                    {autoRefresh && (
                      <p className="text-white/80 text-xs md:text-sm mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                        Atualização automática ativa
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={fetchPedidos}
                    disabled={loadingPedidos}
                    className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-white hover:border-white/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <svg className={`w-4 h-4 md:w-5 md:h-5 ${loadingPedidos ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loadingPedidos ? 'Atualizando...' : 'Atualizar'}
                  </button>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 border-2 ${
                      autoRefresh 
                        ? 'bg-green-500 text-white border-green-400 hover:bg-green-600 hover:shadow-xl' 
                        : 'bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 hover:shadow-xl'
                    }`}
                  >
                    {autoRefresh ? '🔄 Auto ON' : '⏸️ Auto OFF'}
                  </button>
                  <Link
                    href="/painel"
                    className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 hover:shadow-xl"
                  >
                    ← Voltar
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg p-4">
              <p className="text-red-700 font-medium">❌ {error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-xl shadow-lg p-4">
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
            {/* Pedidos Pendentes */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-yellow-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    ⏳
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Pendentes</p>
                  <p className="text-4xl md:text-5xl font-bold text-yellow-600 mb-1">{pedidosPendentes}</p>
                  {pedidosPendentes > 0 && (
                    <p className="text-xs text-yellow-600 font-medium">🔔 Requer atenção!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pedidos Confirmados */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    ✅
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Confirmados</p>
                  <p className="text-4xl md:text-5xl font-bold text-blue-600 mb-1">{pedidosConfirmados}</p>
                </div>
              </div>
            </div>

            {/* Pedidos Preparando */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-purple-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    👨‍🍳
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Preparando</p>
                  <p className="text-4xl md:text-5xl font-bold text-purple-600 mb-1">{pedidosPreparando}</p>
                  {pedidosPreparando > 0 && (
                    <p className="text-xs text-purple-600 font-medium">🔥 Em produção</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pedidos Prontos */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    🍞
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Prontos</p>
                  <p className="text-4xl md:text-5xl font-bold text-green-600 mb-1">{pedidosPronto}</p>
                  {pedidosPronto > 0 && (
                    <p className="text-xs text-green-600 font-medium">📦 Para entrega!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Total Pedidos */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-gray-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    📦
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Total</p>
                  <p className="text-4xl md:text-5xl font-bold text-gray-700 mb-1">{totalPedidos}</p>
                </div>
              </div>
            </div>

            {/* Total Hoje */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-emerald-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    💰
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Hoje</p>
                  <p className="text-2xl md:text-3xl font-bold text-emerald-600 mb-1">R$ {totalHoje.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Ordenação */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center border border-amber-300">
                <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Filtros e Ordenação
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Modalidade</label>
                <select
                  value={filtroModalidade}
                  onChange={(e) => setFiltroModalidade(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                >
                  <option value="todos">Todas</option>
                  <option value="entrega">🚚 Entrega</option>
                  <option value="retirada">🏪 Retirada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  📅 Data de Entrega/Coleta
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                    title="Filtrar por data de entrega ou coleta agendada"
                  />
                  {filtroData && (
                    <button
                      onClick={() => setFiltroData("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                      title="Limpar filtro de data"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {filtroData && (() => {
                  const [ano, mes, dia] = filtroData.split('-').map(Number);
                  const dataFormatada = new Date(ano, mes - 1, dia);
                  return (
                    <p className="text-xs text-gray-500 mt-1">
                      Filtrando entregas/coletas em: {dataFormatada.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  );
                })()}
                {/* Botões rápidos de data */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => {
                      const hoje = new Date();
                      // Garantir que estamos usando o timezone local
                      const ano = hoje.getFullYear();
                      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                      const dia = String(hoje.getDate()).padStart(2, '0');
                      setFiltroData(`${ano}-${mes}-${dia}`);
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      const ontem = new Date();
                      ontem.setDate(ontem.getDate() - 1);
                      // Garantir que estamos usando o timezone local
                      const ano = ontem.getFullYear();
                      const mes = String(ontem.getMonth() + 1).padStart(2, '0');
                      const dia = String(ontem.getDate()).padStart(2, '0');
                      setFiltroData(`${ano}-${mes}-${dia}`);
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Ontem
                  </button>
                  <button
                    onClick={() => setFiltroData("")}
                    className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Ordenar por</label>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                >
                  <option value="urgente">🔥 Mais Urgente</option>
                  <option value="recente">🕐 Mais Recente</option>
                  <option value="antigo">⏰ Mais Antigo</option>
                  <option value="valor">💰 Maior Valor</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
              <p className="font-semibold">
                <strong className="text-[var(--color-avocado-600)] text-lg">{pedidosFiltrados.length}</strong> pedido(s) encontrado(s)
              </p>
              {autoRefresh && (
                <p className="text-green-600 flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Atualização automática ativa
                </p>
              )}
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="space-y-4 md:space-y-6">
            {loadingPedidos ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-avocado-600)] mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg font-medium">Carregando pedidos...</p>
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
                <div className="text-gray-400 text-7xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: "var(--fonte-secundaria)" }}>Nenhum pedido encontrado</h3>
                <p className="text-gray-500">Tente ajustar os filtros ou aguarde novos pedidos</p>
              </div>
            ) : (
            pedidosFiltrados.map((pedido) => {
              const isUrgente = pedido.status === 'pendente' || pedido.status === 'preparando';
              
              return (
                <div 
                  key={pedido._id} 
                  className={`bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 ${
                    isUrgente ? 'ring-2 ring-yellow-400 border-yellow-300' : ''
                  }`}
                >
                  {isUrgente && (
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-3 font-bold text-sm flex items-center gap-2 shadow-lg">
                      <span className="animate-pulse">🔔</span>
                      {pedido.status === 'pendente' ? 'NOVO PEDIDO - AGUARDANDO CONFIRMAÇÃO' : 'EM PREPARO - ATENÇÃO'}
                    </div>
                  )}
                  
                  <div className="p-6 md:p-8">
                    {/* Cabeçalho do Card */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl border border-white/30">
                          <span className="text-white text-xl md:text-2xl font-bold">#{pedido.numeroPedido || pedido._id.slice(-4)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                              Pedido #{pedido.numeroPedido || pedido._id.slice(-6)}
                            </h3>
                            <span className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-bold border-2 ${getStatusColor(pedido.status)}`}>
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
                        <p className="text-3xl md:text-4xl font-bold text-green-600">R$ {pedido.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 font-medium">{pedido.produtos.length} item(s)</p>
                      </div>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 md:p-6 mb-4 border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-lg">
                        👤 Cliente
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {pedido.usuario?.nome && (
                          <p className="bg-white rounded-lg p-3 shadow-sm"><strong>Nome:</strong> {pedido.usuario.nome}</p>
                        )}
                        {pedido.telefone && (
                          <p className="flex items-center gap-1 bg-white rounded-lg p-3 shadow-sm">
                            <strong>📞 Telefone:</strong> 
                            <a href={`tel:${pedido.telefone}`} className="text-blue-600 hover:underline font-medium">
                              {pedido.telefone}
                            </a>
                          </p>
                        )}
                        {pedido.endereco && (
                          <p className="md:col-span-2 bg-white rounded-lg p-3 shadow-sm">
                            <strong>📍 Endereço:</strong> {pedido.endereco.rua}, {pedido.endereco.numero} - {pedido.endereco.bairro}, {pedido.endereco.cidade}
                            {pedido.endereco.cep && ` - CEP: ${pedido.endereco.cep}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Produtos do Pedido */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 md:p-6 mb-4 border border-blue-200">
                      <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-lg">
                        🛒 Produtos ({pedido.produtos.length})
                      </h4>
                      <div className="space-y-2">
                        {pedido.produtos.map((produto, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-xl p-3 md:p-4 border-2 border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{produto.nome}</p>
                              <p className="text-sm text-gray-500">
                                {produto.quantidade}x · R$ {produto.valor.toFixed(2)} cada
                              </p>
                            </div>
                            <p className="font-bold text-blue-600 text-lg">
                              R$ {(produto.valor * produto.quantidade).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observações */}
                    {pedido.observacoes && (
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 md:p-6 mb-4 border-2 border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-lg">
                          📝 Observações do Cliente
                        </h4>
                        <p className="text-sm text-gray-700 italic bg-white rounded-lg p-3">&ldquo;{pedido.observacoes}&rdquo;</p>
                      </div>
                    )}

                    {/* Ações Rápidas */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-200">
                      <button
                        onClick={() => setPedidoSelecionado(pedido)}
                        className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-105 font-bold flex items-center justify-center gap-2 shadow-lg border-2 border-gray-300"
                      >
                        👁️ Ver Detalhes
                      </button>

                      {pedido.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleAcaoRapida(pedido, 'confirmar')}
                            className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 font-bold flex items-center justify-center gap-2 shadow-lg"
                          >
                            ✅ CONFIRMAR
                          </button>
                          <button
                            onClick={() => handleAcaoRapida(pedido, 'cancelar')}
                            className="px-4 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-lg"
                          >
                            ❌
                          </button>
                        </>
                      )}

                      {pedido.status === 'confirmado' && (
                        <button
                          onClick={() => handleAcaoRapida(pedido, 'preparar')}
                          className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-bold flex items-center justify-center gap-2 shadow-lg"
                        >
                          👨‍🍳 INICIAR PREPARO
                        </button>
                      )}

                      {pedido.status === 'preparando' && (
                        <button
                          onClick={() => handleAcaoRapida(pedido, 'pronto')}
                          className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold flex items-center justify-center gap-2 shadow-lg"
                        >
                          🍞 MARCAR PRONTO
                        </button>
                      )}

                      {pedido.status === 'pronto' && (
                        <button
                          onClick={() => handleAcaoRapida(pedido, 'entregar')}
                          className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 font-bold flex items-center justify-center gap-2 shadow-lg"
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
                          className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] font-medium bg-white hover:border-[var(--color-avocado-500)] transition-all duration-300 shadow-lg"
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
      </main>
      <Footer showMap={false} />

      {/* Modal de Detalhes */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Cabeçalho do Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-[var(--color-avocado-600)] via-[var(--color-avocado-500)] to-[var(--color-avocado-600)] p-6 md:p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                    📦 Pedido #{pedidoSelecionado.numeroPedido || pedidoSelecionado._id.slice(-6)}
                  </h2>
                  <p className="text-white/90 text-sm md:text-base">
                    {formatarData(pedidoSelecionado.dataPedido)}
                  </p>
                </div>
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 border border-white/30"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              {/* Timeline do Pedido */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 text-lg" style={{ fontFamily: "var(--fonte-secundaria)" }}>📊 Status do Pedido</h3>
                <PedidoTimeline 
                  statusAtual={pedidoSelecionado.status}
                  modalidade={pedidoSelecionado.modalidadeEntrega}
                  historico={pedidoSelecionado.historico}
                />
              </div>

              {/* Informações Detalhadas do Cliente */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <h3 className="font-bold text-gray-800 mb-4 text-lg" style={{ fontFamily: "var(--fonte-secundaria)" }}>👤 Informações do Cliente</h3>
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
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <h3 className="font-bold text-gray-800 mb-4 text-lg" style={{ fontFamily: "var(--fonte-secundaria)" }}>🛒 Produtos do Pedido</h3>
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
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border-2 border-amber-300">
                  <h3 className="font-bold text-amber-800 mb-3 text-lg flex items-center gap-2" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                    📝 Observações do Cliente
                  </h3>
                  <p className="text-gray-700 bg-white rounded-xl p-4 border border-amber-200 italic shadow-sm">
                    &ldquo;{pedidoSelecionado.observacoes}&rdquo;
                  </p>
                </div>
              )}

              {/* Ações no Modal */}
              <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-lg"
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
                    className="flex-1 px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-lg"
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
