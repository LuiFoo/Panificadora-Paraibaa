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
        <main className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando clientes...</p>
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
              { label: "Clientes", icon: "👥", color: "pink" }
            ]}
          />
          
          <div className="bg-white rounded-lg shadow-md">
            {/* Cabeçalho */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-800">Gerenciar Clientes</h1>
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                        {mostrarTodos ? `${todosUsuarios.length} usuários` : `${clientes.length} clientes`}
                      </span>
                    </div>
                    <p className="text-gray-600">Visualize e gerencie todos os clientes do sistema</p>
                    <p className="text-xs text-pink-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Clique no nome do cliente para ver o perfil completo
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
                    onClick={fetchClientes}
                    disabled={loading}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
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
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumo dos Clientes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-pink-600">Total de Clientes</p>
                      <p className="text-2xl font-bold text-pink-800">{clientes.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">👥</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Com Email</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {clientes.filter(c => c.email).length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">📧</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Com Telefone</p>
                      <p className="text-2xl font-bold text-green-800">
                        {clientes.filter(c => c.telefone).length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">📱</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">🔍 Buscar {mostrarTodos ? "Usuário" : "Cliente"}</h2>
                {clientes.length === 0 && todosUsuarios.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mostrarTodos}
                      onChange={(e) => setMostrarTodos(e.target.checked)}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">Mostrar todos os usuários (incluindo administradores)</span>
                  </label>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por nome, login, email ou telefone
                </label>
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Digite para buscar..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>
            </div>

            {/* Lista de Clientes */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">👥 Lista de {mostrarTodos ? "Usuários" : "Clientes"}</h2>
              {clientesFiltrados.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-gray-500 text-6xl mb-4">👤</div>
                  {listaParaExibir.length === 0 ? (
                    <>
                      <p className="text-gray-600 text-lg font-semibold mb-2">Nenhum {mostrarTodos ? "usuário" : "cliente"} cadastrado</p>
                      <p className="text-gray-500 text-sm">
                        {mostrarTodos 
                          ? "Não há usuários no sistema"
                          : "Não há clientes (usuários com permissão \"usuario\") no sistema"
                        }
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 text-lg font-semibold mb-2">Nenhum {mostrarTodos ? "usuário" : "cliente"} encontrado</p>
                      <p className="text-gray-500 text-sm">Tente ajustar o filtro de busca</p>
                      <p className="text-gray-400 text-xs mt-2">Total: {listaParaExibir.length}</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {clientesFiltrados.map((cliente) => (
                    <div key={cliente.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
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
                            <div className="w-14 h-14 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                              <span className="text-white text-2xl">👤</span>
                            </div>
                          )}
                          
                          <div>
                            <button
                              onClick={() => router.push(`/painel/cliente/${cliente.login}?from=clientes`)}
                              className="font-semibold text-gray-800 hover:text-pink-600 hover:underline cursor-pointer text-left flex items-center gap-1"
                              title="Clique para ver o perfil completo"
                            >
                              {cliente.name}
                              <svg className="w-3 h-3 text-gray-400 hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">@{cliente.login}</p>
                              {cliente.googleId && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                                  🔵 Google
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              {cliente.email && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>📧</span>
                                  {cliente.email}
                                </span>
                              )}
                              {cliente.telefone && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>📱</span>
                                  {cliente.telefone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              cliente.permission === "administrador"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}>
                              {cliente.permission === "administrador" ? "👑 Admin" : "👤 Cliente"}
                            </span>
                            
                            <span className="text-xs text-gray-500">
                              {cliente.dataCriacao 
                                ? new Date(cliente.dataCriacao).toLocaleDateString('pt-BR')
                                : "Sem data"
                              }
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* Apenas Super Admin pode alterar permissões */}
                            {isSuperAdmin && (
                              <>
                                {cliente.permission === "administrador" ? (
                                  <button
                                    onClick={() => handleUpdatePermission(cliente.id, cliente.permission)}
                                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-yellow-500 hover:bg-yellow-600 text-white"
                                    title="Remover permissão de administrador"
                                  >
                                    ⬇️ Remover Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdatePermission(cliente.id, cliente.permission)}
                                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-green-500 hover:bg-green-600 text-white"
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
                                    className="px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-600 cursor-not-allowed"
                                    title="Você não pode deletar sua própria conta"
                                  >
                                    🔒 Você mesmo
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleDeleteUser(cliente.id, cliente.name)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
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
            <div className="p-6 bg-pink-50 border-t border-pink-200">
              <h3 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                <span>ℹ️</span>
                Informações
              </h3>
              <ul className="text-sm text-pink-800 space-y-1">
                <li>• <strong>Clientes:</strong> Usuários cadastrados que podem fazer pedidos e visualizar seu histórico</li>
                <li>• <strong>Perfil:</strong> Clique no nome do cliente para ver informações completas e histórico de pedidos</li>
                <li>• <strong>Data de cadastro:</strong> Registrada automaticamente quando o cliente se cadastra</li>
                <li>• Use o filtro de busca para encontrar clientes específicos rapidamente</li>
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

