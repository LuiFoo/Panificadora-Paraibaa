"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/Modal";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

interface Usuario {
  id: string;
  login: string;
  name: string;
  email: string;
  telefone: string;
  permission: string;
  permissaoSuprema?: boolean | string; // Aceita boolean true ou string "true" do MongoDB
  dataCriacao: string | null;
  ultimoAcesso: string | null;
  picture?: string; // Foto do Google
  googleId?: string;
}

export default function GerenciarUsuarios() {
  const router = useRouter();
  const { isSuperAdmin, user: currentUser } = useUser();
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
      
      // Verificar se resposta é JSON válido antes de fazer parse
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
        setLoading(false);
        return;
      }
      
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
    // Verificar se o usuário logado tem permissão suprema
    if (!isSuperAdmin) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "❌ Acesso Negado",
        message: "Apenas usuários com Permissão Suprema podem alterar permissões de outros usuários."
      });
      return;
    }
    
    // Alternar entre admin e usuário
    const newPermission = currentPermission === "administrador" ? "usuario" : "administrador";
    const actionText = newPermission === "administrador" ? "promovido a Administrador" : "rebaixado para Usuário";
    
    setModalState({
      isOpen: true,
      type: "confirm",
      title: "Confirmar Alteração de Permissão",
      message: `Deseja realmente alterar a permissão deste usuário para "${newPermission === "administrador" ? "Administrador" : "Usuário"}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch("/api/admin/usuarios", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              permission: newPermission
            })
          });

          // Verificar se resposta é JSON válido antes de fazer parse
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
            setSuccess(`✅ Permissão atualizada! Usuário ${actionText}.`);
            setTimeout(() => setSuccess(""), 3000);
            fetchUsuarios();
            
            // Disparar evento para notificar outros usuários logados
            window.dispatchEvent(new CustomEvent('permissionUpdated', {
              detail: { 
                userId, 
                newPermission,
                message: `Permissão atualizada! Usuário ${actionText}.`
              }
            }));
          } else {
            setError(data.error || "Erro ao atualizar permissão");
            setTimeout(() => setError(""), 3000);
          }
        } catch (err) {
          console.error("Erro ao atualizar permissão:", err);
          setError("Erro ao conectar com o servidor");
          setTimeout(() => setError(""), 3000);
        }
      }
    });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    // Verificar se o usuário logado tem permissão suprema
    if (!isSuperAdmin) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "❌ Acesso Negado",
        message: "Apenas usuários com Permissão Suprema podem deletar usuários. Esta é uma ação irreversível e requer privilégios especiais.",
        onConfirm: undefined
      });
      return;
    }

    // Verificar se está tentando deletar a si mesmo
    if (currentUser?._id === userId) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "❌ Operação Não Permitida",
        message: "Você não pode deletar sua própria conta. Peça a outro Super Admin para fazer isso se necessário.",
        onConfirm: undefined
      });
      return;
    }

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

          // Verificar se resposta é JSON válido antes de fazer parse
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
            setSuccess("✅ Usuário deletado com sucesso!");
            setTimeout(() => setSuccess(""), 3000);
            fetchUsuarios();
          } else {
            // Tratar códigos de erro específicos
            if (data.code === "CANNOT_DELETE_SELF") {
              setError("❌ Você não pode deletar sua própria conta.");
            } else if (data.code === "LAST_SUPER_ADMIN") {
              setError("⚠️ Não é possível deletar o último Super Admin. Promova outro usuário primeiro.");
            } else {
              setError(data.error || "Erro ao deletar usuário");
            }
            setTimeout(() => setError(""), 5000);
          }
        } catch (err) {
          console.error("Erro ao deletar usuário:", err);
          setError("❌ Erro ao conectar com o servidor");
          setTimeout(() => setError(""), 3000);
        }
      }
    });
  };

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(user => {
    const matchFiltro = 
      (user.name?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
      (user.login?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(filtro.toLowerCase());
    
    const matchPermissao = 
      filtroPermissao === "todos" || 
      user.permission === filtroPermissao;

    return matchFiltro && matchPermissao;
  });

  const totalAdmins = usuarios.filter(u => u.permission === "administrador").length;
  const totalClientes = usuarios.filter(u => u.permission === "usuario").length;
  // Aceita tanto boolean true quanto string "true"
  const totalSuperAdmins = usuarios.filter(u => u.permissaoSuprema === true || u.permissaoSuprema === "true").length;

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-avocado-600)] mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg font-medium">Carregando usuários...</p>
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
      <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BreadcrumbNav 
            items={[
              { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
              { label: "Usuários", icon: "👥", color: "purple" }
            ]}
          />
          
          {/* Top Bar */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-6 mb-8">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <p>{usuarios.length} usuários cadastrados</p>
                      {isSuperAdmin && (
                        <span className="flex items-center gap-1.5 text-orange-600">
                          <span>⭐</span>
                          Permissão Suprema
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={fetchUsuarios}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Atualizando...' : 'Atualizar'}
                  </button>
                  <Link
                    href="/painel"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Voltar
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Usuários cadastrados</p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Super Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSuperAdmins}</p>
                  <p className="text-xs text-gray-500 mt-1">Controle total</p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Administradores</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
                  <p className="text-xs text-gray-500 mt-1">Com acesso ao painel</p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
                  <p className="text-xs text-gray-500 mt-1">Clientes do sistema</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[var(--color-avocado-50)] rounded-lg">
                  <svg className="w-5 h-5 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Filtros e Busca</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por nome, login ou email</label>
                  <input
                    type="text"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Digite para buscar..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-600)] focus:border-[var(--color-avocado-600)] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por permissão</label>
                  <select
                    value={filtroPermissao}
                    onChange={(e) => setFiltroPermissao(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-600)] focus:border-[var(--color-avocado-600)] transition-all text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="usuario">Apenas Usuários</option>
                    <option value="administrador">Apenas Administradores</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
              <p className="font-medium text-gray-700">
                <span className="text-[var(--color-avocado-600)] font-bold">{usuariosFiltrados.length}</span> usuário(s) encontrado(s)
              </p>
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-avocado-50)] rounded-lg">
                  <svg className="w-5 h-5 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Lista de Usuários</h2>
              </div>
            </div>
            
            <div className="p-6">
              {usuariosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👤</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-gray-500">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usuariosFiltrados.map((user) => (
                    <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Foto do usuário (Google) ou avatar padrão */}
                          {user.picture && user.picture.trim() !== '' ? (
                            <div className="relative w-14 h-14 flex-shrink-0">
                              <Image
                                src={user.picture}
                                alt={user.name}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-300"
                                unoptimized={!user.picture?.includes('googleusercontent.com')}
                              />
                              {user.permission === "administrador" && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                  <span className="text-xs">👑</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                              <span className="text-white text-2xl">
                                {user.permission === "administrador" ? "👑" : "👤"}
                              </span>
                            </div>
                          )}
                          
                          <div>
                            <button
                              onClick={() => router.push(`/painel/usuarios/${user.login}?from=usuarios`)}
                              className="font-semibold text-gray-800 hover:text-blue-600 hover:underline cursor-pointer text-left flex items-center gap-1"
                              title="Clique para ver o perfil completo"
                            >
                              {user.name}
                              <svg className="w-3 h-3 text-gray-400 hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">@{user.login}</p>
                              {user.googleId && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                                  🔵 Google
                                </span>
                              )}
                            </div>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                user.permission === "administrador"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.permission === "administrador" ? "👑 Admin" : "👤 Usuário"}
                            </span>
                            
                            {/* Badge de Permissão Suprema */}
                            {user.permissaoSuprema && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                                ⭐ SUPER ADMIN
                              </span>
                            )}
                            
                            <span className="text-xs text-gray-500">
                              {user.dataCriacao 
                                ? (() => {
                                    const data = new Date(user.dataCriacao);
                                    return isNaN(data.getTime()) ? "Data inválida" : data.toLocaleDateString('pt-BR');
                                  })()
                                : "Sem data"
                              }
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* Apenas Super Admin pode alterar permissões */}
                            {isSuperAdmin && (
                              <>
                                {user.permission === "administrador" ? (
                                  <button
                                    onClick={() => handleUpdatePermission(user.id, user.permission)}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-yellow-600 hover:shadow-xl border-2 border-yellow-600 hover:border-yellow-500"
                                    title="Remover permissão de administrador"
                                  >
                                    ⬇️ Remover Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdatePermission(user.id, user.permission)}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
                                    title="Promover a administrador"
                                  >
                                    ⬆️ Promover Admin
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* Mostrar badge se NÃO tem permissão suprema */}
                            {!isSuperAdmin && user.permission === "administrador" && (
                              <span className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md bg-white text-gray-600 border-2 border-gray-300">
                                🔒 Apenas Super Admin pode alterar
                              </span>
                            )}
                            
                            {/* Apenas Super Admin pode deletar usuários */}
                            {isSuperAdmin && (
                              <>
                                {/* Não pode deletar a si mesmo */}
                                {currentUser?._id === user.id ? (
                                  <span 
                                    className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md bg-white text-gray-600 border-2 border-gray-300 cursor-not-allowed"
                                    title="Você não pode deletar sua própria conta"
                                  >
                                    🔒 Você mesmo
                                  </span>
                                ) : user.permissaoSuprema && totalSuperAdmins <= 1 ? (
                                  /* Não pode deletar o último Super Admin */
                                  <span 
                                    className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md bg-white text-yellow-800 border-2 border-yellow-300 cursor-not-allowed"
                                    title="Não é possível deletar o último Super Admin. Promova outro usuário primeiro."
                                  >
                                    ⚠️ Último Super Admin
                                  </span>
                                ) : (
                                  /* Pode deletar */
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-red-600 hover:shadow-xl border-2 border-red-600 hover:border-red-500"
                                    title="Deletar usuário permanentemente"
                                  >
                                    🗑️ Deletar
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center border border-blue-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Informações
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-800"><strong>👤 Usuários:</strong> Podem fazer pedidos e visualizar seu histórico</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-purple-800"><strong>👑 Administradores:</strong> Têm acesso total ao painel administrativo</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800"><strong>⭐ Permissões:</strong> Podem ser alteradas clicando nos botões de ação</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-800"><strong>📅 Data de cadastro:</strong> Registrada automaticamente quando o usuário se cadastra</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>💡 Dica:</strong> Use o filtro de busca para encontrar usuários específicos rapidamente. A exclusão de usuários é permanente e não pode ser desfeita.
              </p>
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