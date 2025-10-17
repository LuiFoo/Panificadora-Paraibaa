"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/Modal";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
    // Apenas permitir remover admin (não promover a admin)
    if (currentPermission !== "administrador") {
      setError("Não é permitido promover usuários a administrador através desta interface");
      return;
    }
    
    const newPermission = "usuario";
    
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
        setSuccess(`Permissão removida! Usuário agora é Usuário padrão.`);
        setTimeout(() => setSuccess(""), 3000);
        fetchUsuarios();
        
        // Disparar evento para notificar outros usuários logados
        window.dispatchEvent(new CustomEvent('permissionUpdated', {
          detail: { 
            userId, 
            newPermission,
            message: `Permissão removida! Usuário agora é Usuário padrão.`
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

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
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
          <BreadcrumbNav 
            items={[
              { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
              { label: "Usuários", icon: "👥", color: "purple" }
            ]}
          />
          
          <div className="bg-white rounded-lg shadow-md">
            {/* Cabeçalho */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                        {usuarios.length} usuários
                      </span>
                    </div>
                    <p className="text-gray-600">Visualize e gerencie todos os usuários do sistema</p>
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Clique no nome do usuário para ver o perfil completo
                    </p>
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
                    onClick={fetchUsuarios}
                    disabled={loading}
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
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumo dos Usuários</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Total de Usuários</p>
                      <p className="text-2xl font-bold text-blue-800">{usuarios.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">👥</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">Administradores</p>
                      <p className="text-2xl font-bold text-purple-800">{totalAdmins}</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">👑</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Usuários Padrão</p>
                      <p className="text-2xl font-bold text-green-800">{totalClientes}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">👤</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filtros e Busca</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar por nome, login ou email
                  </label>
                  <input
                    type="text"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Digite para buscar..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por permissão
                  </label>
                  <select
                    value={filtroPermissao}
                    onChange={(e) => setFiltroPermissao(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <option value="todos">Todos</option>
                    <option value="usuario">Apenas Usuários</option>
                    <option value="administrador">Apenas Administradores</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de Usuários */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">👥 Lista de Usuários</h2>
              {usuariosFiltrados.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-gray-500 text-6xl mb-4">👤</div>
                  <p className="text-gray-600 text-lg">Nenhum usuário encontrado</p>
                  <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usuariosFiltrados.map((user) => (
                    <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">
                              {user.permission === "administrador" ? "👑" : "👤"}
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => router.push(`/painel/cliente/${user.login}?from=usuarios`)}
                              className="font-semibold text-gray-800 hover:text-blue-600 hover:underline cursor-pointer text-left flex items-center gap-1"
                              title="Clique para ver o perfil completo"
                            >
                              {user.name}
                              <svg className="w-3 h-3 text-gray-400 hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                            <p className="text-sm text-gray-600">@{user.login}</p>
                            <div className="flex items-center gap-4 mt-1">
                              {user.email && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>📧</span>
                                  {user.email}
                                </span>
                              )}
                              {user.telefone && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>📱</span>
                                  {user.telefone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                user.permission === "administrador"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.permission === "administrador" ? "👑 Admin" : "👤 Usuário"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {user.dataCriacao 
                                ? new Date(user.dataCriacao).toLocaleDateString('pt-BR')
                                : "Sem data"
                              }
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {user.permission === "administrador" && (
                              <button
                                onClick={() => handleUpdatePermission(user.id, user.permission)}
                                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-yellow-500 hover:bg-yellow-600 text-white"
                              >
                                ⬇️ Remover Admin
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              🗑️ Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="p-6 bg-blue-50 border-t border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>ℹ️</span>
                Informações
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Usuários:</strong> Podem fazer pedidos e visualizar seu histórico</li>
                <li>• <strong>Administradores:</strong> Têm acesso total ao painel administrativo</li>
                <li>• <strong>Permissões:</strong> Podem ser alteradas clicando nos botões de ação</li>
                <li>• <strong>Data de cadastro:</strong> Registrada automaticamente quando o usuário se cadastra</li>
                <li>• Use o filtro de busca para encontrar usuários específicos rapidamente</li>
                <li>• A exclusão de usuários é permanente e não pode ser desfeita</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
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