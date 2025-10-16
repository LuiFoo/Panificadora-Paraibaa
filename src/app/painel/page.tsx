"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useState, useEffect } from "react";

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

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/dashboard-stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando painel administrativo...</p>
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
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <span className="text-gray-800 font-medium">Painel Administrativo</span>
              </li>
            </ol>
          </nav>
          
          <div className="bg-white rounded-lg shadow-md">
            {/* Breadcrumb */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm text-gray-600">
                <li>
                  <span className="text-gray-800 font-medium">Painel Administrativo</span>
                </li>
              </ol>
            </nav>

            {/* Cabeçalho */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
              <div>
                    <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
                <p className="text-gray-600">Bem-vindo, {user?.name}</p>
              </div>
                </div>
                <div className="flex gap-3">
              <button
                onClick={fetchStats}
                disabled={loading}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                    Atualizar
              </button>
                </div>
              </div>
            </div>
            
            {/* Estatísticas Rápidas */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumo do Sistema</h2>
              {stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Pedidos Hoje</p>
                        <p className="text-2xl font-bold text-blue-800">{stats.pedidosHoje}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">📦</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Total Usuários</p>
                        <p className="text-2xl font-bold text-green-800">{stats.totalUsuarios}</p>
                      </div>
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">👥</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Total Produtos</p>
                        <p className="text-2xl font-bold text-purple-800">{stats.totalProdutos}</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">🍞</span>
                      </div>
                    </div>
                        </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-600">Pendentes</p>
                        <p className="text-2xl font-bold text-amber-800">{stats.pedidosPorStatus.pendente}</p>
                        </div>
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">⏳</span>
                      </div>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="text-center py-8">
                  <div className="text-red-500 text-4xl mb-2">❌</div>
                  <p className="text-gray-600">Erro ao carregar estatísticas</p>
                  </div>
                )}
              </div>

            {/* Navegação Principal */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">🚀 Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Usuários */}
                <Link href="/painel/usuarios" className="group">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 group-hover:border-indigo-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">Usuários</h3>
                        <p className="text-sm text-gray-600">Gerenciar usuários do sistema</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Produtos */}
                <Link href="/painel/produtos" className="group">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 group-hover:border-green-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">Produtos</h3>
                        <p className="text-sm text-gray-600">Gerenciar catálogo de produtos</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                  </div>
                </div>
              </Link>
              
                {/* Pedidos */}
                <Link href="/painel/pedidos" className="group">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 group-hover:border-purple-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">Pedidos</h3>
                        <p className="text-sm text-gray-600">Visualizar e gerenciar pedidos</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Mensagens */}
                <Link href="/painel/mensagens" className="group">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 group-hover:border-cyan-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors">Mensagens</h3>
                        <p className="text-sm text-gray-600">Responder mensagens dos clientes</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                  </div>
                </div>
              </Link>
              
                {/* Status dos Pedidos */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Status dos Pedidos</h3>
                      <p className="text-sm text-gray-600">Resumo por status</p>
                    </div>
                  </div>
                  {stats && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-yellow-600 flex items-center gap-2">
                          <span>⏳</span>
                          Pendente
                        </span>
                        <span className="font-bold bg-yellow-100 px-2 py-1 rounded-full text-yellow-800">{stats.pedidosPorStatus.pendente}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600 flex items-center gap-2">
                          <span>✅</span>
                          Confirmado
                        </span>
                        <span className="font-bold bg-green-100 px-2 py-1 rounded-full text-green-800">{stats.pedidosPorStatus.confirmado}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-600 flex items-center gap-2">
                          <span>❌</span>
                          Cancelado
                        </span>
                        <span className="font-bold bg-red-100 px-2 py-1 rounded-full text-red-800">{stats.pedidosPorStatus.cancelado}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-600 flex items-center gap-2">
                          <span>🚚</span>
                          Entregue
                        </span>
                        <span className="font-bold bg-blue-100 px-2 py-1 rounded-full text-blue-800">{stats.pedidosPorStatus.entregue}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informações do Sistema */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Sistema</h3>
                      <p className="text-sm text-gray-600">Informações gerais</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Online</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Última atualização:</span>
                      <span className="text-gray-800">{new Date().toLocaleTimeString('pt-BR')}</span>
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