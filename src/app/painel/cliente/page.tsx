"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import Modal from "@/components/Modal";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Cliente {
  id: string;
  login: string;
  name: string;
  email: string;
  telefone: string;
  permission: string;
  dataCriacao: string | null;
  ultimoAcesso: string | null;
  picture?: string;
  googleId?: string;
}

export default function GerenciarClientes() {
  const router = useRouter();
  const { isSuperAdmin, user: currentUser } = useUser();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filtro, setFiltro] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [todosUsuarios, setTodosUsuarios] = useState<Cliente[]>([]);
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

  const fetchClientes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/usuarios");
      const data = await response.json();
      if (data.success) {
        console.log("Total de usuários retornados:", data.usuarios.length);
        console.log("Permissões encontradas:", [...new Set(data.usuarios.map((u: Cliente) => u.permission))]);
        
        // Salvar todos os usuários para debug
        setTodosUsuarios(data.usuarios);
        
        // Filtrar apenas clientes (usuários com permissão "usuario" ou sem permissão definida)
        const clientesFiltrados = data.usuarios.filter(
          (user: Cliente) => {
            // Considera cliente se permission é "usuario" ou se não está definido (padrão é "usuario")
            const permission = user.permission?.toLowerCase() || "usuario";
            const isCliente = permission === "usuario" || permission === "";
            
            if (!isCliente) {
              console.log(`Usuário ${user.name} (${user.login}) tem permissão: "${user.permission}"`);
            }
            return isCliente;
          }
        );
        
        console.log("Total de clientes filtrados:", clientesFiltrados.length);
        setClientes(clientesFiltrados);
        
        if (clientesFiltrados.length === 0 && data.usuarios.length > 0) {
          const admins = data.usuarios.filter((u: Cliente) => u.permission === "administrador");
          setError(`Nenhum cliente encontrado. Existem ${data.usuarios.length} usuários no total, sendo ${admins.length} administradores.`);
        }
      } else {
        setError(data.error || "Erro ao buscar clientes");
      }
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
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
            fetchClientes();
            
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
            fetchClientes();
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

  // Filtrar clientes
  const listaParaExibir = mostrarTodos ? todosUsuarios : clientes;
  const clientesFiltrados = listaParaExibir.filter(cliente => {
    const matchFiltro = 
      cliente.name.toLowerCase().includes(filtro.toLowerCase()) ||
      cliente.login.toLowerCase().includes(filtro.toLowerCase()) ||
      cliente.email.toLowerCase().includes(filtro.toLowerCase()) ||
      (cliente.telefone && cliente.telefone.includes(filtro));

    return matchFiltro;
  });

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-avocado-600)] mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg font-medium">Carregando clientes...</p>
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
              { label: "Clientes", icon: "👤", color: "pink" }
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                        Gerenciar Clientes
                      </h1>
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-bold rounded-full border border-white/30 shadow-lg">
                        {mostrarTodos ? `${todosUsuarios.length} usuários` : `${clientes.length} clientes`}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm md:text-base lg:text-lg">
                      Visualize e gerencie todos os clientes do sistema
                    </p>
                    <p className="text-white/80 text-xs md:text-sm mt-1 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Clique no nome do cliente para ver o perfil completo
                    </p>
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
                    onClick={fetchClientes}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Total de Clientes */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-pink-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    👥
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Total de Clientes</p>
                  <p className="text-4xl md:text-5xl font-bold text-pink-600 mb-1">{clientes.length}</p>
                  <p className="text-xs text-gray-500">Clientes cadastrados</p>
                </div>
              </div>
            </div>

            {/* Com Email */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    📧
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Com Email</p>
                  <p className="text-4xl md:text-5xl font-bold text-blue-600 mb-1">{clientes.filter(c => c.email).length}</p>
                  <p className="text-xs text-gray-500">Com email cadastrado</p>
                </div>
              </div>
            </div>

            {/* Com Telefone */}
            <div className="group relative bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-2xl">
                    📱
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Com Telefone</p>
                  <p className="text-4xl md:text-5xl font-bold text-green-600 mb-1">{clientes.filter(c => c.telefone).length}</p>
                  <p className="text-xs text-gray-500">Com telefone cadastrado</p>
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
                Buscar {mostrarTodos ? "Usuário" : "Cliente"}
              </h2>
            </div>
            <div className="space-y-4">
              {clientes.length === 0 && todosUsuarios.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mostrarTodos}
                      onChange={(e) => setMostrarTodos(e.target.checked)}
                      className="w-5 h-5 text-[var(--color-avocado-600)] border-gray-300 rounded focus:ring-[var(--color-avocado-500)]"
                    />
                    <span className="text-sm font-semibold text-gray-700">Mostrar todos os usuários (incluindo administradores)</span>
                  </label>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Buscar por nome, login, email ou telefone
                </label>
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
              <p className="font-semibold">
                <strong className="text-[var(--color-avocado-600)] text-lg">{clientesFiltrados.length}</strong> {mostrarTodos ? "usuário(s)" : "cliente(s)"} encontrado(s)
              </p>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center border border-amber-300">
                <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Lista de {mostrarTodos ? "Usuários" : "Clientes"}
              </h2>
            </div>
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-7xl mb-4">👤</div>
                {listaParaExibir.length === 0 ? (
                  <>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: "var(--fonte-secundaria)" }}>Nenhum {mostrarTodos ? "usuário" : "cliente"} cadastrado</h3>
                    <p className="text-gray-500">
                      {mostrarTodos 
                        ? "Não há usuários no sistema"
                        : "Não há clientes (usuários com permissão \"usuario\") no sistema"
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: "var(--fonte-secundaria)" }}>Nenhum {mostrarTodos ? "usuário" : "cliente"} encontrado</h3>
                    <p className="text-gray-500">Tente ajustar o filtro de busca</p>
                    <p className="text-gray-400 text-sm mt-2">Total: {listaParaExibir.length}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-4 md:p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Foto do cliente (Google) ou avatar padrão */}
                          {cliente.picture && cliente.picture.trim() !== '' ? (
                            <div className="relative w-14 h-14 flex-shrink-0">
                              <Image
                                src={cliente.picture}
                                alt={cliente.name}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-300"
                                unoptimized={!cliente.picture.includes('googleusercontent.com')}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl border-2 border-pink-300/50">
                              <span className="text-white text-3xl">👤</span>
                            </div>
                          )}
                          
                          <div>
                            <button
                              onClick={() => router.push(`/painel/cliente/${cliente.login}?from=clientes`)}
                              className="font-bold text-lg md:text-xl text-gray-800 hover:text-pink-600 hover:underline cursor-pointer text-left flex items-center gap-2 mb-1 transition-colors"
                              title="Clique para ver o perfil completo"
                            >
                              {cliente.name}
                              <svg className="w-4 h-4 text-gray-400 hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <p className="text-sm text-gray-600 font-medium">@{cliente.login}</p>
                              {cliente.googleId && (
                                <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1 border border-blue-300">
                                  🔵 Google
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {cliente.email && (
                                <span className="text-xs text-gray-600 flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-200">
                                  <span>📧</span>
                                  {cliente.email}
                                </span>
                              )}
                              {cliente.telefone && (
                                <span className="text-xs text-gray-600 flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-200">
                                  <span>📱</span>
                                  {cliente.telefone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 ${
                              cliente.permission === "administrador"
                                ? "bg-purple-100 text-purple-800 border-purple-300"
                                : "bg-green-100 text-green-800 border-green-300"
                            }`}>
                              {cliente.permission === "administrador" ? "👑 Admin" : "👤 Cliente"}
                            </span>
                            
                            <span className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 font-medium">
                              📅 {cliente.dataCriacao 
                                ? new Date(cliente.dataCriacao).toLocaleDateString('pt-BR')
                                : "Sem data"
                              }
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* Apenas Super Admin pode alterar permissões */}
                            {isSuperAdmin && (
                              <>
                                {cliente.permission === "administrador" ? (
                                  <button
                                    onClick={() => handleUpdatePermission(cliente.id, cliente.permission)}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg"
                                    title="Remover permissão de administrador"
                                  >
                                    ⬇️ Remover Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdatePermission(cliente.id, cliente.permission)}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] hover:from-[var(--color-avocado-600)] hover:to-[var(--color-avocado-700)] text-white shadow-lg"
                                    title="Promover a administrador"
                                  >
                                    ⬆️ Promover Admin
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* Apenas Super Admin pode deletar usuários */}
                            {isSuperAdmin && (
                              <>
                                {/* Não pode deletar a si mesmo */}
                                {currentUser?._id === cliente.id ? (
                                  <span 
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-md bg-gradient-to-br from-gray-400 to-gray-500 text-white cursor-not-allowed"
                                    title="Você não pode deletar sua própria conta"
                                  >
                                    🔒 Você mesmo
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleDeleteUser(cliente.id, cliente.name)}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
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
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center border border-pink-300">
                <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Informações
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                <p className="text-sm text-pink-800"><strong>👤 Clientes:</strong> Usuários cadastrados que podem fazer pedidos e visualizar seu histórico</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-800"><strong>📋 Perfil:</strong> Clique no nome do cliente para ver informações completas e histórico de pedidos</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-800"><strong>📅 Data de cadastro:</strong> Registrada automaticamente quando o cliente se cadastra</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-800"><strong>🔍 Busca:</strong> Use o filtro de busca para encontrar clientes específicos rapidamente</p>
              </div>
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

