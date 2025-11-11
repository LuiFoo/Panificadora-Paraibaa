"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  pedidosHoje: number;
  totalUsuarios: number;
  totalProdutos: number;
  pedidosPorStatus: {
    pendente: number;
    confirmado: number;
    cancelado: number;
    entregue: number;
  };
}

export default function Painel() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const router = useRouter();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/dashboard-stats");
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setLastUpdate(new Date());
      } else {
        setStats({
          pedidosHoje: 0,
          totalUsuarios: 0,
          totalProdutos: 0,
          pedidosPorStatus: {
            pendente: 0,
            confirmado: 0,
            cancelado: 0,
            entregue: 0
          }
        });
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      setStats({
        pedidosHoje: 0,
        totalUsuarios: 0,
        totalProdutos: 0,
        pedidosPorStatus: {
          pendente: 0,
          confirmado: 0,
          cancelado: 0,
          entregue: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Redirecionar automaticamente para /painel/cliente
  useEffect(() => {
    router.push("/painel/cliente");
  }, [router]);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-avocado-600)] mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg font-medium">Carregando painel administrativo...</p>
            </div>
          </div>
        </main>
        <Footer showMap={false} />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <BreadcrumbNav 
            items={[
              { label: "Painel Administrativo", icon: "🏠", color: "blue" }
            ]}
          />
          
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-white">Painel Administrativo</h1>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full border border-white/30">
                        Admin
                      </span>
                    </div>
                    <p className="text-white/90 text-sm md:text-base">Bem-vindo, <span className="font-semibold">{user?.name || 'Administrador'}</span></p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Atualizar
                  </button>
                </div>
              </div>
            </div>

            {/* Estatísticas Principais */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-avocado-100)] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Resumo do Sistema
                </h2>
                <div className="text-xs text-gray-500">
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </div>
              </div>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Pedidos Hoje */}
                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pedidos Hoje</p>
                      <p className="text-4xl font-bold text-blue-600 mb-1">{stats.pedidosHoje}</p>
                      <p className="text-xs text-gray-500">Novos pedidos</p>
                    </div>
                  </div>

                  {/* Total Usuários */}
                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Usuários</p>
                      <p className="text-4xl font-bold text-green-600 mb-1">{stats.totalUsuarios}</p>
                      <p className="text-xs text-gray-500">Usuários cadastrados</p>
                    </div>
                  </div>

                  {/* Total Produtos */}
                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-purple-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Produtos</p>
                      <p className="text-4xl font-bold text-purple-600 mb-1">{stats.totalProdutos}</p>
                      <p className="text-xs text-gray-500">No catálogo</p>
                    </div>
                  </div>

                  {/* Pedidos Pendentes */}
                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-amber-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pendentes</p>
                      <p className="text-4xl font-bold text-amber-600 mb-1">{stats.pedidosPorStatus.pendente}</p>
                      <p className="text-xs text-gray-500">Aguardando ação</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-red-500 text-6xl mb-4">❌</div>
                  <p className="text-gray-600 text-lg font-medium">Erro ao carregar estatísticas</p>
                </div>
              )}
            </div>

            {/* Status dos Pedidos */}
            {stats && (
              <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-avocado-100)] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Status dos Pedidos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-yellow-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-3xl">⏳</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pendente</p>
                      <p className="text-4xl font-bold text-yellow-600 mb-1">{stats.pedidosPorStatus.pendente}</p>
                      <p className="text-xs text-gray-500">Aguardando</p>
                    </div>
                  </div>

                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-3xl">✅</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Confirmado</p>
                      <p className="text-4xl font-bold text-green-600 mb-1">{stats.pedidosPorStatus.confirmado}</p>
                      <p className="text-xs text-gray-500">Confirmados</p>
                    </div>
                  </div>

                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-red-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-3xl">❌</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Cancelado</p>
                      <p className="text-4xl font-bold text-red-600 mb-1">{stats.pedidosPorStatus.cancelado}</p>
                      <p className="text-xs text-gray-500">Cancelados</p>
                    </div>
                  </div>

                  <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-3xl">🚚</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Entregue</p>
                      <p className="text-4xl font-bold text-blue-600 mb-1">{stats.pedidosPorStatus.entregue}</p>
                      <p className="text-xs text-gray-500">Entregues</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ações Rápidas */}
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-avocado-100)] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Usuários */}
                <Link href="/painel/usuarios" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors mb-1">Usuários</h3>
                        <p className="text-sm text-gray-600">Gerenciar usuários do sistema</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Produtos */}
                <Link href="/painel/produtos" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-[var(--color-avocado-300)] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-[var(--color-avocado-600)] transition-colors mb-1">Produtos</h3>
                        <p className="text-sm text-gray-600">Gerenciar catálogo de produtos</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-[var(--color-avocado-500)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              
                {/* Pedidos */}
                <Link href="/painel/pedidos" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors mb-1">Pedidos</h3>
                        <p className="text-sm text-gray-600">Visualizar e gerenciar pedidos</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Mensagens */}
                <Link href="/painel/mensagens" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-cyan-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-cyan-600 transition-colors mb-1">Mensagens</h3>
                        <p className="text-sm text-gray-600">Responder mensagens dos clientes</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Clientes */}
                <Link href="/painel/cliente" className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-pink-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-pink-600 transition-colors mb-1">Clientes</h3>
                        <p className="text-sm text-gray-600">Gerenciar informações dos clientes</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Informações do Sistema */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">Sistema</h3>
                      <p className="text-sm text-gray-600">Informações gerais</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Online</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Atualizado:</span>
                      <span className="text-sm text-gray-800 font-medium">{lastUpdate.toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer showMap={false} />
    </ProtectedRoute>
  );
}
