"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import Link from "next/link";

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

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--color-avocado-600)] border-t-transparent mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg font-medium">Carregando painel...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer showMap={false} />
      </ProtectedRoute>
    );
  }

  const quickActions = [
    {
      title: "Produtos",
      description: "Gerenciar catálogo",
      href: "/painel/produtos",
      icon: "🛍️",
      color: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"
    },
    {
      title: "Pedidos",
      description: "Visualizar pedidos",
      href: "/painel/pedidos",
      icon: "📦",
      color: "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500"
    },
    {
      title: "Usuários",
      description: "Gerenciar usuários",
      href: "/painel/usuarios",
      icon: "👥",
      color: "bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500"
    },
    {
      title: "Mensagens",
      description: "Responder clientes",
      href: "/painel/mensagens",
      icon: "💬",
      color: "bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500"
    }
  ];

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
                  <p className="text-sm text-gray-600">Olá, {user?.name || 'Administrador'}</p>
                </div>
              </div>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview - Horizontal Cards */}
          {stats && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--color-avocado-600)] rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold opacity-80">HOJE</span>
                  </div>
                  <p className="text-4xl font-bold mb-1">{stats.pedidosHoje}</p>
                  <p className="text-sm opacity-90">Novos pedidos</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold opacity-80">TOTAL</span>
                  </div>
                  <p className="text-4xl font-bold mb-1">{stats.totalUsuarios}</p>
                  <p className="text-sm opacity-90">Usuários cadastrados</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold opacity-80">TOTAL</span>
                  </div>
                  <p className="text-4xl font-bold mb-1">{stats.totalProdutos}</p>
                  <p className="text-sm opacity-90">Produtos no catálogo</p>
                </div>

                <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold opacity-80">PENDENTES</span>
                  </div>
                  <p className="text-4xl font-bold mb-1">{stats.pedidosPorStatus.pendente}</p>
                  <p className="text-sm opacity-90">Aguardando ação</p>
                </div>
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Status dos Pedidos - Left Column */}
            {stats && (
              <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Status dos Pedidos</h2>
                  <span className="text-xs text-gray-500">Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pedidosPorStatus.pendente}</p>
                    <p className="text-sm text-gray-600">Pendente</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pedidosPorStatus.confirmado}</p>
                    <p className="text-sm text-gray-600">Confirmado</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pedidosPorStatus.cancelado}</p>
                    <p className="text-sm text-gray-600">Cancelado</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-avocado-100)] rounded-full mb-3">
                      <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pedidosPorStatus.entregue}</p>
                    <p className="text-sm text-gray-600">Entregue</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sistema Info - Right Column */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sistema</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700">Status</span>
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700">Última atualização</span>
                  <span className="text-sm font-semibold text-gray-900">{lastUpdate.toLocaleTimeString('pt-BR')}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Versão do Sistema</p>
                  <p className="text-sm font-semibold text-gray-900">v2.0.0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Rápidas - Grid Layout */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="group relative overflow-hidden bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 ${action.color} opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity`}></div>
                  
                  <div className="relative">
                    <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[var(--color-avocado-600)] transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer showMap={false} />
    </ProtectedRoute>
  );
}
