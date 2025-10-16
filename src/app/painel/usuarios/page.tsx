"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/Modal";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Usuario {
  id: string;
  login: string;
  name: string;
  email: string;
  telefone: string;
  permission: string;
  dataCriacao: string | null;
  ultimoAcesso: string | null;
}

export default function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filtro, setFiltro] = useState("");
  const [filtroPermissao, setFiltroPermissao] = useState<string>("todos");
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

  const fetchUsuarios = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/usuarios");
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      } else {
        setError(data.error || "Erro ao buscar usuários");
      }
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleUpdatePermission = async (userId: string, currentPermission: string) => {
    const newPermission = currentPermission === "administrador" ? "usuario" : "administrador";
    
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          permission: newPermission
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Permissão atualizada para ${newPermission === "administrador" ? "Administrador" : "Usuário"}!`);
        setTimeout(() => setSuccess(""), 3000);
        fetchUsuarios();
        
        // Disparar evento para notificar outros usuários logados
        window.dispatchEvent(new CustomEvent('permissionUpdated', {
          detail: { 
            userId, 
            newPermission,
            message: `Permissão atualizada para ${newPermission === "administrador" ? "Administrador" : "Usuário"}`
          }
        }));
      } else {
        setError(data.error || "Erro ao atualizar permissão");
      }
    } catch (err) {
      console.error("Erro ao atualizar permissão:", err);
      setError("Erro ao conectar com o servidor");
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setModalState({
      isOpen: true,
      type: "warning",
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja deletar o usuário "${userName}"? Esta ação não pode ser desfeita!`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/usuarios?userId=${userId}`, {
            method: "DELETE"
          });

          const data = await response.json();
          if (data.success) {
            setSuccess("Usuário deletado com sucesso!");
            setTimeout(() => setSuccess(""), 3000);
            fetchUsuarios();
          } else {
            setError(data.error || "Erro ao deletar usuário");
          }
        } catch (err) {
          console.error("Erro ao deletar usuário:", err);
          setError("Erro ao conectar com o servidor");
        }
      }
    });
  };

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(user => {
    const matchFiltro = 
      user.name.toLowerCase().includes(filtro.toLowerCase()) ||
      user.login.toLowerCase().includes(filtro.toLowerCase()) ||
      user.email.toLowerCase().includes(filtro.toLowerCase());
    
    const matchPermissao = 
      filtroPermissao === "todos" || 
      user.permission === filtroPermissao;

    return matchFiltro && matchPermissao;
  });

  const totalAdmins = usuarios.filter(u => u.permission === "administrador").length;
  const totalClientes = usuarios.filter(u => u.permission === "usuario").length;

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link 
                  href="/painel" 
                  className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-flex items-center"
                >
                  ← Voltar ao Painel
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Gerenciar Usuários</h1>
                <p className="text-gray-600">Visualize e gerencie todos os usuários do sistema</p>
              </div>
              <button
                onClick={fetchUsuarios}
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

            {/* Mensagens */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total de Usuários</p>
                    <p className="text-3xl font-bold text-blue-800">{usuarios.length}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Administradores</p>
                    <p className="text-3xl font-bold text-purple-800">{totalAdmins}</p>
                  </div>
                  <div className="text-4xl">👑</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Usuários Padrão</p>
                    <p className="text-3xl font-bold text-green-800">{totalClientes}</p>
                  </div>
                  <div className="text-4xl">👤</div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Buscar por nome, login ou email
                </label>
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Filtrar por permissão
                </label>
                <select
                  value={filtroPermissao}
                  onChange={(e) => setFiltroPermissao(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="usuario">Apenas Usuários</option>
                  <option value="administrador">Apenas Administradores</option>
                </select>
              </div>
            </div>

            {/* Tabela de Usuários */}
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-gray-600 mt-4">Carregando usuários...</p>
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-600 text-lg">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Permissão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Data de Cadastro
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuariosFiltrados.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-500">@{user.login}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {user.email && <p className="text-gray-700">📧 {user.email}</p>}
                            {user.telefone && <p className="text-gray-700">📱 {user.telefone}</p>}
                            {!user.email && !user.telefone && <p className="text-gray-400">Sem contato</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                              user.permission === "administrador"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.permission === "administrador" ? "👑 Admin" : "👤 Usuário"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.dataCriacao 
                            ? new Date(user.dataCriacao).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "Não informado"
                          }
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleUpdatePermission(user.id, user.permission)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                user.permission === "administrador"
                                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                  : "bg-green-500 hover:bg-green-600 text-white"
                              }`}
                            >
                              {user.permission === "administrador" ? "⬇️ Remover Admin" : "⬆️ Tornar Admin"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                            >
                              🗑️ Deletar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Informações adicionais */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Usuários:</strong> Podem fazer pedidos e visualizar seu histórico</li>
                <li>• <strong>Administradores:</strong> Têm acesso total ao painel administrativo</li>
                <li>• <strong>Permissões:</strong> São apenas visualização, não podem ser alteradas aqui</li>
                <li>• <strong>Data de cadastro:</strong> Registrada automaticamente quando o usuário se cadastra</li>
                <li>• Use o filtro de busca para encontrar usuários específicos rapidamente</li>
                <li>• A exclusão de usuários é permanente e não pode ser desfeita</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
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
    </ProtectedRoute>
  );
}

