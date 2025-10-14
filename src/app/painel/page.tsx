"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

export default function Painel() {
  const { user } = useUser();

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel Administrativo</h1>
            <p className="text-gray-600 mb-6">Bem-vindo, {user?.name}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card de Estatísticas Rápidas */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Dashboard</h3>
                <p className="text-blue-600 mb-3">Visão geral do sistema</p>
                <div className="text-sm text-blue-500">
                  • Pedidos hoje: 0<br/>
                  • Usuários ativos: 0<br/>
                  • Produtos cadastrados: 0
                </div>
              </div>

              {/* Card de Usuários */}
              <div className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">👥 Usuários</h3>
                <p className="text-blue-600">Gerenciar usuários do sistema</p>
                <div className="mt-2 text-sm text-blue-500">
                  Em breve...
                </div>
              </div>
              
              {/* Card de Produtos - Link Ativo */}
              <Link href="/painel/produtos" className="block">
                <div className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors cursor-pointer border-2 border-transparent hover:border-green-300">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">🛍️ Produtos</h3>
                  <p className="text-green-600">Gerenciar catálogo de produtos</p>
                  <div className="mt-2 text-sm text-green-500 font-medium">
                    ✅ Disponível - Clique para acessar →
                  </div>
                </div>
              </Link>
              
              {/* Card de Pedidos - Link Ativo */}
              <Link href="/painel/pedidos" className="block">
                <div className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer border-2 border-transparent hover:border-purple-300">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">📦 Pedidos</h3>
                  <p className="text-purple-600">Visualizar e gerenciar pedidos</p>
                  <div className="mt-2 text-sm text-purple-500 font-medium">
                    ✅ Disponível - Clique para acessar →
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
