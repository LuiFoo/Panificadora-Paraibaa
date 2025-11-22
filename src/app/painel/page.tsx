"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
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
        <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
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

  const quickActions = [
    {
      title: "Produtos",
      description: "Gerenciar catálogo",
      href: "/painel/produtos",
      icon: "🛍️",
      color: "from-[var(--color-avocado-500)] to-[var(--color-avocado-600)]",
      hoverColor: "hover:from-[var(--color-avocado-600)] hover:to-[var(--color-avocado-700)]",
      borderColor: "border-[var(--color-avocado-200)]"
    },
    {
      title: "Pedidos",
      description: "Visualizar pedidos",
      href: "/painel/pedidos",
      icon: "📦",
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      borderColor: "border-purple-200"
    },
    {
      title: "Usuários",
      description: "Gerenciar usuários",
      href: "/painel/usuarios",
      icon: "👥",
      color: "from-indigo-500 to-indigo-600",
      hoverColor: "hover:from-indigo-600 hover:to-indigo-700",
      borderColor: "border-indigo-200"
    },
    {
      title: "Mensagens",
      description: "Responder clientes",
      href: "/painel/mensagens",
      icon: "💬",
      color: "from-cyan-500 to-cyan-600",
      hoverColor: "hover:from-cyan-600 hover:to-cyan-700",
      borderColor: "border-cyan-200"
    },
    {
      title: "Clientes",
      description: "Ver perfis",
      href: "/painel/cliente",
      icon: "👤",
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
      borderColor: "border-pink-200"
    }
  ];

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <BreadcrumbNav 
            items={[
              { label: "Painel Administrativo", icon: "🏠", color: "blue" }
            ]}
          />
          
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[var(--color-avocado-600)] via-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-3xl shadow-2xl p-6 md:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                        Painel Administrativo
                      </h1>
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-bold rounded-full border border-white/30 shadow-lg">
                        Admin
                      </span>
                    </div>
                    <p className="text-white/90 text-sm md:text-base lg:text-lg">
                      Bem-vindo, <span className="font-bold text-white">{user?.name || 'Administrador'}</span>
                    </p>
                    <p className="text-white/80 text-xs md:text-sm mt-1">
                      Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-white hover:border-white/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* Estatísticas Principais */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Pedidos Hoje */}
              <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Pedidos Hoje</p>
                    <p className="text-4xl md:text-5xl font-bold text-blue-600 mb-1">{stats.pedidosHoje}</p>
                    <p className="text-xs text-gray-500">Novos pedidos recebidos</p>
                  </div>
                </div>
              </div>

              {/* Total Usuários */}
              <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                {/* Efeito de fundo decorativo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    {/* Container do Ícone */}
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      {/* SVG Corrigido (Ícone de Usuários) */}
                      <svg 
                        className="w-7 h-7 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                        />
                      </svg>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Total Usuários</p>
                    <p className="text-4xl md:text-5xl font-bold text-green-600 mb-1">{stats.totalUsuarios}</p>
                    <p className="text-xs text-gray-500">Usuários cadastrados</p>
                  </div>
                </div>
              </div>

              {/* Total Produtos */}
              <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-purple-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Total Produtos</p>
                    <p className="text-4xl md:text-5xl font-bold text-purple-600 mb-1">{stats.totalProdutos}</p>
                    <p className="text-xs text-gray-500">No catálogo</p>
                  </div>
                </div>
              </div>

              {/* Pedidos Pendentes */}
              <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-amber-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Pendentes</p>
                    <p className="text-4xl md:text-5xl font-bold text-amber-600 mb-1">{stats.pedidosPorStatus.pendente}</p>
                    <p className="text-xs text-gray-500">Aguardando ação</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status dos Pedidos */}
          {stats && (
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-avocado-100)] to-[var(--color-avocado-200)] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                  Status dos Pedidos
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-200 hover:border-yellow-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">⏳</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pendente</p>
                    <p className="text-3xl md:text-4xl font-bold text-yellow-600 mb-1">{stats.pedidosPorStatus.pendente}</p>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Confirmado</p>
                    <p className="text-3xl md:text-4xl font-bold text-green-600 mb-1">{stats.pedidosPorStatus.confirmado}</p>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200 hover:border-red-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">❌</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Cancelado</p>
                    <p className="text-3xl md:text-4xl font-bold text-red-600 mb-1">{stats.pedidosPorStatus.cancelado}</p>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🚚</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Entregue</p>
                    <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">{stats.pedidosPorStatus.entregue}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-avocado-100)] to-[var(--color-avocado-200)] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Ações Rápidas
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {quickActions.map((action, index) => (
                <Link 
                  key={index}
                  href={action.href} 
                  className="group relative overflow-hidden bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-[var(--color-avocado-600)] transition-colors mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-[var(--color-avocado-600)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}

              {/* Card de Sistema */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-sm text-gray-600 font-medium">Status:</span>
                    <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full text-xs font-bold shadow-md">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-sm text-gray-600 font-medium">Atualizado:</span>
                    <span className="text-sm text-gray-800 font-semibold">{lastUpdate.toLocaleTimeString('pt-BR')}</span>
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
