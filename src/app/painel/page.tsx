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

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel Administrativo</h1>
                <p className="text-gray-600">Bem-vindo, {user?.name}</p>
              </div>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <svg 
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card de Estatísticas Rápidas */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 flex flex-col h-full min-h-[200px]">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Dashboard</h3>
                <p className="text-blue-600 mb-3 flex-grow">Visão geral do sistema</p>
                {loading ? (
                  <div className="text-sm text-blue-500">
                    Carregando...
                  </div>
                ) : stats ? (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">📦 Pedidos hoje:</span>
                      <span className="font-bold text-blue-800">{stats.pedidosHoje}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">👥 Usuários:</span>
                      <span className="font-bold text-blue-800">{stats.totalUsuarios}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">🍞 Produtos:</span>
                      <span className="font-bold text-blue-800">{stats.totalProdutos}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <p className="text-xs text-blue-700 font-semibold mb-1">Status dos Pedidos:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-600">⏳ Pendente:</span>
                          <span className="font-bold">{stats.pedidosPorStatus.pendente}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600">✅ Confirmado:</span>
                          <span className="font-bold">{stats.pedidosPorStatus.confirmado}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-red-600">❌ Cancelado:</span>
                          <span className="font-bold">{stats.pedidosPorStatus.cancelado}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600">🚚 Entregue:</span>
                          <span className="font-bold">{stats.pedidosPorStatus.entregue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-500">
                    Erro ao carregar dados
                  </div>
                )}
              </div>

              {/* Card de Usuários */}
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-200 flex flex-col h-full min-h-[200px] opacity-70">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">👥 Usuários</h3>
                <p className="text-indigo-600 mb-3 flex-grow">Gerenciar usuários do sistema</p>
                <div className="mt-auto">
                  <div className="bg-indigo-200 text-indigo-800 text-xs font-semibold px-3 py-2 rounded-full inline-block">
                    🔒 Em desenvolvimento
                  </div>
                </div>
              </div>
              
              {/* Card de Produtos - Link Ativo */}
              <Link href="/painel/produtos" className="block h-full min-h-[200px] group">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg hover:from-green-100 hover:to-green-200 transition-all cursor-pointer border-2 border-green-300 hover:border-green-400 hover:shadow-lg flex flex-col h-full transform hover:scale-105 duration-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">🍞 Produtos</h3>
                  <p className="text-green-700 mb-3 flex-grow">Gerenciar catálogo de produtos</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-full">
                      ✅ Disponível
                    </div>
                    <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
              
              {/* Card de Pedidos - Link Ativo */}
              <Link href="/painel/pedidos" className="block h-full min-h-[200px] group">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all cursor-pointer border-2 border-purple-300 hover:border-purple-400 hover:shadow-lg flex flex-col h-full transform hover:scale-105 duration-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">📦 Pedidos</h3>
                  <p className="text-purple-700 mb-3 flex-grow">Visualizar e gerenciar pedidos</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-full">
                      ✅ Disponível
                    </div>
                    <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer showMap={false} />
    </ProtectedRoute>
  );
}
