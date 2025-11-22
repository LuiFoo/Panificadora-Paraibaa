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

          const data = await response.json();
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

          const data = await response.json();
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
      <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <BreadcrumbNav 
            items={[
              { label: "Painel Administrativo", href: "/painel", icon: "🏠", color: "blue" },
              { label: "Usuários", icon: "👥", color: "purple" }
            ]}
          />
          
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[var(--color-avocado-600)] via-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-3xl shadow-2xl p-6 md:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      {/* Usuário central maior */}
                      <circle cx="12" cy="7" r="4"/>
                      <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
                      {/* Usuário à esquerda (menor) */}
                      <circle cx="3" cy="5" r="2.5" opacity="0.7"/>
                      <path d="M0 16v-1.5a2.5 2.5 0 0 1 2.5-2.5h1a2.5 2.5 0 0 1 2.5 2.5V16" opacity="0.7"/>
                      {/* Usuário à direita (menor) */}
                      <circle cx="21" cy="5" r="2.5" opacity="0.7"/>
                      <path d="M24 16v-1.5a2.5 2.5 0 0 0-2.5-2.5h-1a2.5 2.5 0 0 0-2.5 2.5V16" opacity="0.7"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                        Gerenciar Usuários
                      </h1>
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-bold rounded-full border border-white/30 shadow-lg">
                        {usuarios.length} usuários
                      </span>
                    </div>
                    <p className="text-white/90 text-sm md:text-base lg:text-lg">
                      Visualize e gerencie todos os usuários do sistema
                    </p>
                    {isSuperAdmin ? (
                      <p className="text-white/80 text-xs md:text-sm mt-1 flex items-center gap-2">
                        <span>⭐</span>
                        Você tem <strong>Permissão Suprema</strong> e pode promover/rebaixar administradores
                      </p>
                    ) : (
                      <p className="text-white/80 text-xs md:text-sm mt-1 flex items-center gap-2">
                        <span>🔒</span>
                        Apenas usuários com <strong>Permissão Suprema</strong> podem alterar permissões
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/painel"
                    className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 hover:shadow-xl"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Voltar
                  </Link>
                  <button
                    onClick={fetchUsuarios}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Total de Usuários */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    👥
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Total de Usuários</p>
                  <p className="text-4xl md:text-5xl font-bold text-blue-600 mb-1">{usuarios.length}</p>
                  <p className="text-xs text-gray-500">Usuários cadastrados</p>
                </div>
              </div>
            </div>

            {/* Super Admins */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-yellow-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    ⭐
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Super Admins</p>
                  <p className="text-4xl md:text-5xl font-bold text-orange-600 mb-1">{totalSuperAdmins}</p>
                  <p className="text-xs text-orange-600 font-medium">⭐ Controle Total</p>
                </div>
              </div>
            </div>

            {/* Administradores */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-purple-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    👑
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Administradores</p>
                  <p className="text-4xl md:text-5xl font-bold text-purple-600 mb-1">{totalAdmins}</p>
                  <p className="text-xs text-gray-500">Com acesso ao painel</p>
                </div>
              </div>
            </div>

            {/* Usuários Padrão */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    👤
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Usuários Padrão</p>
                  <p className="text-4xl md:text-5xl font-bold text-green-600 mb-1">{totalClientes}</p>
                  <p className="text-xs text-gray-500">Clientes do sistema</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center border border-amber-300">
                <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Filtros e Busca
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Buscar por nome, login ou email
                </label>
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Filtrar por permissão
                </label>
                <select
                  value={filtroPermissao}
                  onChange={(e) => setFiltroPermissao(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                >
                  <option value="todos">Todos</option>
                  <option value="usuario">Apenas Usuários</option>
                  <option value="administrador">Apenas Administradores</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
              <p className="font-semibold">
                <strong className="text-[var(--color-avocado-600)] text-lg">{usuariosFiltrados.length}</strong> usuário(s) encontrado(s)
              </p>
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center border border-amber-300">
                <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  {/* Ícone de lista com usuários */}
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                  <circle cx="5.5" cy="6" r="1.5"/>
                  <circle cx="5.5" cy="12" r="1.5"/>
                  <circle cx="5.5" cy="18" r="1.5"/>
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Lista de Usuários
              </h2>
            </div>
            {usuariosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-7xl mb-4">👤</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: "var(--fonte-secundaria)" }}>Nenhum usuário encontrado</h3>
                <p className="text-gray-500">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {usuariosFiltrados.map((user) => (
                  <div key={user.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-4 md:p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300">
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
                                unoptimized={!user.picture.includes('googleusercontent.com')}
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
                              onClick={() => router.push(`/painel/cliente/${user.login}?from=usuarios`)}
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
                                ? new Date(user.dataCriacao).toLocaleDateString('pt-BR')
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