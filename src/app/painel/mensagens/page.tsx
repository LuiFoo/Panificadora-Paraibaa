"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/Modal";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Mensagem {
  _id: string;
  userId: string;
  userName: string;
  mensagem: string;
  remetente: "cliente" | "admin";
  dataEnvio: string;
  lida: boolean;
}

interface Conversa {
  userId: string;
  userName: string;
  mensagens: Mensagem[];
  ultimaMensagem: string;
  naoLidas: number;
}

interface Usuario {
  _id: string;
  login: string;
  name: string;
}

export default function MensagensAdminPage() {
  const router = useRouter();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaTemporaria, setConversaTemporaria] = useState<Conversa | null>(null);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [conversaExpandida, setConversaExpandida] = useState<string | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mostrarNovaConversa, setMostrarNovaConversa] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<Usuario[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buscaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para scroll automático para o final
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      
      // Força o scroll com animação suave
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Definir conversaAtual antes dos useEffects
  const conversaAtual = conversaTemporaria || conversas.find(c => c.userId === conversaSelecionada);

  const fetchConversas = useCallback(async () => {
    try {
      const response = await fetch("/api/mensagens?isAdmin=true");
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // API já retorna as conversas ordenadas (mais recente primeiro)
          setConversas(data.conversas);
          
          // Scroll automático quando receber novas mensagens
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inicial das conversas
  useEffect(() => {
    fetchConversas();
    
    // Polling inteligente - só quando a página está visível
    const intervalRef = { current: null as NodeJS.Timeout | null };
    
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(fetchConversas, 30000);
    };
    
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Página ficou visível, buscar conversas imediatamente
        fetchConversas();
        // Reiniciar polling
        startPolling();
      }
    };
    
    // Iniciar polling se página estiver visível
    if (!document.hidden) {
      startPolling();
    }
    
    // Escutar mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Limpar timeout se existir
      if (buscaTimeoutRef.current) {
        clearTimeout(buscaTimeoutRef.current);
      }
    };
  }, [fetchConversas]);

  useEffect(() => {
    // Marcar mensagens do cliente como lidas quando admin abre a conversa
    if (conversaSelecionada) {
      marcarComoLida(conversaSelecionada);
    }
  }, [conversaSelecionada]);

  // Scroll automático quando abrir uma conversa
  useEffect(() => {
    if (conversaExpandida) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [conversaExpandida]);

  // Scroll automático quando as mensagens mudarem
  useEffect(() => {
    if (conversaExpandida) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [conversas, conversaTemporaria, conversaExpandida]);

  const marcarComoLida = async (userId: string) => {
    try {
      await fetch("/api/mensagens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          marcarComoLida: true,
          isAdmin: true
        })
      });
      
      // Atualizar contador no header
      window.dispatchEvent(new Event('refreshMensagensCount'));
    } catch (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
    }
  };


  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaMensagem.trim() || !conversaSelecionada || enviando) return;

    setEnviando(true);

    try {
      const response = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: conversaSelecionada,
          userName: conversaAtual?.userName || "Admin",
          mensagem: novaMensagem,
          remetente: "admin"
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
        setModalState({
          isOpen: true,
          type: "error",
          title: "Erro",
          message: "Erro ao processar resposta do servidor"
        });
        return;
      }
      
      if (data.success) {
        setNovaMensagem("");
        
        // Limpar conversa temporária se existir
        if (conversaTemporaria) {
          setConversaTemporaria(null);
        }
        
        await fetchConversas();
        
        // Atualizar contador no header
        window.dispatchEvent(new Event('refreshMensagensCount'));
        
        // Manter foco no campo de input após enviar
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        
        // Scroll automático para o final após enviar mensagem
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      let errorMessage = "Erro ao enviar resposta. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (error.message.includes('500')) {
          errorMessage = "Erro interno do servidor. Tente novamente em alguns instantes.";
        }
      }
      
      setModalState({
        isOpen: true,
        type: "error",
        title: "Erro",
        message: errorMessage
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleDeletarConversa = () => {
    if (!conversaSelecionada) return;

    // Usar conversa temporária se existir, senão buscar nas conversas normais
    const conversa = conversaTemporaria || conversas.find(c => c.userId === conversaSelecionada);
    
    setModalState({
      isOpen: true,
      type: "warning",
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja deletar toda a conversa com ${conversa?.userName || "este cliente"}? Esta ação não pode ser desfeita.`,
      onConfirm: confirmarDeletarConversa
    });
  };

  const confirmarDeletarConversa = async () => {
    if (!conversaSelecionada) return;

    try {
      const response = await fetch(`/api/mensagens?userId=${conversaSelecionada}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setModalState({
          isOpen: true,
          type: "success",
          title: "Sucesso",
          message: "Conversa deletada com sucesso!"
        });

        // Limpar conversa temporária se existir
        if (conversaTemporaria) {
          setConversaTemporaria(null);
        }

        // Atualizar lista de conversas
        await fetchConversas();
        
        // Limpar conversa selecionada
        setConversaSelecionada(null);
        
        // Atualizar contador no header
        window.dispatchEvent(new Event('refreshMensagensCount'));
      }
    } catch (error) {
      console.error("Erro ao deletar conversa:", error);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Erro",
        message: "Erro ao deletar conversa. Tente novamente."
      });
    }
  };

  const handleBuscarUsuarios = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsuariosEncontrados([]);
      return;
    }

    setBuscandoUsuarios(true);
    try {
      const url = `/api/buscar-usuarios?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setUsuariosEncontrados(data.usuarios || []);
      } else {
        const errorData = await response.json();
        console.error("Erro na busca de usuários:", errorData);
        setUsuariosEncontrados([]);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setBuscandoUsuarios(false);
    }
  }, []);

  // Função para abrir perfil do cliente
  const handleAbrirPerfilCliente = (userId: string) => {
    // Navegar para a página do perfil do cliente usando Next.js router
    // Passar informação de onde veio via query parameter
    router.push(`/painel/usuarios/${userId}?from=mensagens`);
  };

  const handleSelecionarUsuario = (usuario: Usuario) => {
    // Criar conversa temporária
    const novaConversa: Conversa = {
      userId: usuario.login,
      userName: usuario.name,
      mensagens: [],
      ultimaMensagem: new Date().toISOString(),
      naoLidas: 0
    };

    setConversaTemporaria(novaConversa);
    setConversaSelecionada(usuario.login);
    setConversaExpandida(usuario.login);
    setMostrarNovaConversa(false);
    setBuscaUsuario("");
    setUsuariosEncontrados([]);
  };

  const handleToggleConversa = (userId: string) => {
    if (conversaExpandida === userId) {
      // Se já está expandida, fecha
      setConversaExpandida(null);
      setConversaSelecionada(null);
      setConversaTemporaria(null);
    } else {
      // Abre nova conversa
      setConversaExpandida(userId);
      setConversaSelecionada(userId);
      setConversaTemporaria(null);
    }
  };

  const handleNovaConversa = () => {
    setMostrarNovaConversa(true);
    setBuscaUsuario("");
    setUsuariosEncontrados([]);
  };

  const handleCancelarNovaConversa = () => {
    setMostrarNovaConversa(false);
    setBuscaUsuario("");
    setUsuariosEncontrados([]);
    
    // Limpar timeout se existir
    if (buscaTimeoutRef.current) {
      clearTimeout(buscaTimeoutRef.current);
      buscaTimeoutRef.current = null;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-[var(--cor-main)] via-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-avocado-600)] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando mensagens...</p>
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
              { label: "Mensagens", icon: "💬", color: "cyan" }
            ]}
          />
          
          {/* Top Bar */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-6 mb-8">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Mensagens dos Clientes</h1>
                    <p className="text-sm text-gray-600">{conversas.length} conversa{conversas.length !== 1 ? 's' : ''} ativa{conversas.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleNovaConversa}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Nova Conversa
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

          {/* Lista de Conversas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Lista de Conversas com Sistema de Expansão */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden w-full">
              {(conversas.length === 0 && !conversaTemporaria) ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma conversa encontrada</h3>
                  <p className="text-gray-500">Inicie uma nova conversa para começar</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4 p-4 md:p-6 relative">
                  {/* Incluir conversa temporária se existir */}
                  {conversaTemporaria && (
                    <div key={conversaTemporaria.userId} className="bg-white border border-gray-200 rounded-xl conversa-container shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
                      {/* Cabeçalho da Conversa Temporária - Sempre Visível */}
                      <div
                        onClick={() => handleToggleConversa(conversaTemporaria.userId)}
                        className={`p-3 md:p-4 cursor-pointer conversa-header transition-all duration-200 hover:bg-gray-50 ${
                          conversaExpandida === conversaTemporaria.userId ? 'expanded bg-blue-50 border-blue-200' : 'hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Nome do usuário e ID */}
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirPerfilCliente(conversaTemporaria.userId);
                                }}
                                className="font-semibold text-gray-800 truncate text-sm md:text-base hover:text-blue-600 hover:underline cursor-pointer text-left"
                              >
                                {conversaTemporaria.userName}
                              </button>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full w-fit">
                                @{conversaTemporaria.userId}
                              </span>
                              {/* Indicador de expansão */}
                              <span className="text-xs text-gray-400">
                                {conversaExpandida === conversaTemporaria.userId ? '▼' : '▶'}
                              </span>
                              {/* Indicador de conversa nova */}
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full w-fit">
                                Nova
                              </span>
                            </div>
                            
                            {/* Preview da mensagem */}
                            <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-2 mb-1">
                              <p className="text-xs md:text-sm text-gray-600 truncate conversa-preview flex-1">
                                Nova conversa iniciada
                              </p>
                            </div>
                            
                            {/* Horário da última mensagem */}
                            <div className="flex flex-col md:flex-row md:items-center gap-1">
                              <span className="text-xs text-gray-400">
                                📅 {new Date(conversaTemporaria.ultimaMensagem).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="text-xs text-gray-400 hidden md:inline">
                                • 0 msg
                              </span>
                              <span className="text-xs text-gray-400 md:hidden">
                                0 msg
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Área de Mensagens - Expansível */}
                      {conversaExpandida === conversaTemporaria.userId && (
                        <div className="border-t border-gray-200 conversa-expandida">
                          {/* Cabeçalho da Conversa Expandida */}
                          <div className="p-4 md:p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-b-2 border-cyan-200">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div>
                                <h4 className="font-bold text-gray-800 text-base md:text-lg" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                  Nova conversa com {conversaTemporaria.userName}
                                </h4>
                                <p className="text-xs md:text-sm text-gray-600">ID: {conversaTemporaria.userId}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversaSelecionada(conversaTemporaria.userId);
                                  handleDeletarConversa();
                                }}
                                className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                🗑️ Deletar
                              </button>
                            </div>
                          </div>

                          {/* Mensagens */}
                          <div 
                            ref={conversaExpandida === conversaTemporaria.userId ? messagesContainerRef : null}
                            className="max-h-[250px] overflow-y-auto overflow-x-hidden p-4 space-y-4 chat-container bg-gradient-to-b from-gray-50 to-white"
                          >
                            <div className="text-center text-gray-500 py-8">
                              <p className="text-sm">Nova conversa</p>
                              <p className="text-xs">Envie sua primeira mensagem para iniciar</p>
                            </div>
                            <div ref={conversaExpandida === conversaTemporaria.userId ? messagesEndRef : null} />
                          </div>

                          {/* Input de Mensagem */}
                          {conversaSelecionada === conversaTemporaria.userId && (
                            <form onSubmit={handleEnviarResposta} className="p-2 md:p-4 border-t border-gray-200">
                              <div className="flex gap-2">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={novaMensagem}
                                  onChange={(e) => setNovaMensagem(e.target.value)}
                                  placeholder="Digite sua mensagem..."
                                  className="flex-1 px-4 py-3 text-sm md:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                                  disabled={enviando}
                                />
                                <button
                                  type="submit"
                                  disabled={enviando || !novaMensagem.trim()}
                                  className="bg-gradient-to-br from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] hover:from-[var(--color-avocado-600)] hover:to-[var(--color-avocado-700)] disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 text-sm md:text-base shadow-lg hover:shadow-xl disabled:shadow-none disabled:hover:scale-100"
                                >
                                  {enviando ? 'Enviando...' : 'Enviar'}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {conversas.map((conversa) => (
                    <div key={conversa.userId} className="bg-white border border-gray-200 rounded-xl conversa-container shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
                      {/* Cabeçalho da Conversa - Sempre Visível */}
                      <div
                        onClick={() => handleToggleConversa(conversa.userId)}
                        className={`p-3 md:p-4 cursor-pointer conversa-header transition-all duration-200 hover:bg-gray-50 ${
                          conversaExpandida === conversa.userId ? 'expanded bg-blue-50 border-blue-200' : 'hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Nome do usuário e ID */}
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirPerfilCliente(conversa.userId);
                                }}
                                className="font-semibold text-gray-800 truncate text-sm md:text-base hover:text-blue-600 hover:underline cursor-pointer text-left"
                              >
                                {conversa.userName}
                              </button>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full w-fit">
                                @{conversa.userId}
                              </span>
                              {/* Indicador de expansão */}
                              <span className="text-xs text-gray-400">
                                {conversaExpandida === conversa.userId ? '▼' : '▶'}
                              </span>
                            </div>
                            
                            {/* Preview da mensagem */}
                            <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-2 mb-1">
                              {(() => {
                                const ultimaMensagem = conversa.mensagens[conversa.mensagens.length - 1];
                                if (!ultimaMensagem) return null;
                                
                                return (
                                  <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                                    ultimaMensagem.remetente === 'admin' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {ultimaMensagem.remetente === 'admin' ? '👤 Admin' : '👤 Cliente'}
                                  </span>
                                );
                              })()}
                              <p 
                                className="text-xs md:text-sm text-gray-600 truncate conversa-preview flex-1"
                                title={conversa.mensagens[conversa.mensagens.length - 1]?.mensagem || 'Nenhuma mensagem'}
                              >
                                {(() => {
                                  const mensagem = conversa.mensagens[conversa.mensagens.length - 1]?.mensagem || 'Nenhuma mensagem';
                                  return mensagem.length > 40 ? mensagem.substring(0, 40) + '...' : mensagem;
                                })()}
                              </p>
                            </div>
                            
                            {/* Horário da última mensagem */}
                            <div className="flex flex-col md:flex-row md:items-center gap-1">
                              <span className="text-xs text-gray-400">
                                📅 {new Date(conversa.ultimaMensagem).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="text-xs text-gray-400 hidden md:inline">
                                • {conversa.mensagens.length} msg{conversa.mensagens.length !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-400 md:hidden">
                                {conversa.mensagens.length} msg{conversa.mensagens.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Badge de mensagens não lidas */}
                          {conversa.naoLidas > 0 && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-bold">
                                {conversa.naoLidas}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Área de Mensagens - Expansível */}
                      {conversaExpandida === conversa.userId && (
                        <div className="border-t border-gray-200 conversa-expandida">
                          {/* Cabeçalho da Conversa Expandida */}
                          <div className="p-4 md:p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-b-2 border-cyan-200">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div>
                                <h4 className="font-bold text-gray-800 text-base md:text-lg" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                                  Conversa com {conversa.userName}
                                </h4>
                                <p className="text-xs md:text-sm text-gray-600">ID: {conversa.userId}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversaSelecionada(conversa.userId);
                                  handleDeletarConversa();
                                }}
                                className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                              >
                                🗑️ Deletar
                              </button>
                            </div>
                          </div>

                          {/* Mensagens */}
                          <div 
                            ref={conversaExpandida === conversa.userId ? messagesContainerRef : null}
                            className="max-h-[250px] overflow-y-auto overflow-x-hidden p-4 space-y-4 chat-container bg-gradient-to-b from-gray-50 to-white"
                          >
                            {conversa.mensagens.length === 0 ? (
                              <div className="text-center text-gray-500 py-8">
                                <p className="text-sm">Nenhuma mensagem ainda</p>
                                <p className="text-xs">Inicie a conversa enviando uma mensagem</p>
                              </div>
                            ) : (
                              conversa.mensagens.map((mensagem) => (
                                <div
                                  key={mensagem._id}
                                  className={`flex ${mensagem.remetente === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[85%] md:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl chat-message shadow-sm ${
                                      mensagem.remetente === 'admin'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 mr-auto'
                                    }`}
                                  >
                                    <p className="text-sm break-words" style={{ whiteSpace: 'pre-wrap' }}>
                                      {mensagem.mensagem}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                      mensagem.remetente === 'admin' ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                      {new Date(mensagem.dataEnvio).toLocaleString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                            <div ref={conversaExpandida === conversa.userId ? messagesEndRef : null} />
                          </div>

                          {/* Input de Mensagem */}
                          {conversaSelecionada === conversa.userId && (
                            <form onSubmit={handleEnviarResposta} className="p-2 md:p-4 border-t border-gray-200">
                              <div className="flex gap-2">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={novaMensagem}
                                  onChange={(e) => setNovaMensagem(e.target.value)}
                                  placeholder="Digite sua mensagem..."
                                  className="flex-1 px-4 py-3 text-sm md:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
                                  disabled={enviando}
                                />
                                <button
                                  type="submit"
                                  disabled={enviando || !novaMensagem.trim()}
                                  className="bg-gradient-to-br from-[var(--color-avocado-500)] to-[var(--color-avocado-600)] hover:from-[var(--color-avocado-600)] hover:to-[var(--color-avocado-700)] disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 text-sm md:text-base shadow-lg hover:shadow-xl disabled:shadow-none disabled:hover:scale-100"
                                >
                                  {enviando ? 'Enviando...' : 'Enviar'}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal para Nova Conversa */}
      {mostrarNovaConversa && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center border border-cyan-300">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: "var(--fonte-secundaria)" }}>Nova Conversa</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar usuário:
              </label>
              <input
                type="text"
                value={buscaUsuario}
                onChange={(e) => {
                  const value = e.target.value;
                  setBuscaUsuario(value);
                  
                  // Limpar timeout anterior
                  if (buscaTimeoutRef.current) {
                    clearTimeout(buscaTimeoutRef.current);
                  }
                  
                  if (value.trim()) {
                    // Debounce de 300ms
                    buscaTimeoutRef.current = setTimeout(() => {
                      handleBuscarUsuarios(value);
                    }, 300);
                  } else {
                    setUsuariosEncontrados([]);
                  }
                }}
                placeholder="Digite o nome ou login do usuário..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-[var(--color-avocado-500)] transition-all font-medium bg-white hover:border-gray-400"
              />
            </div>

            {buscandoUsuarios && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}

            {usuariosEncontrados.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">Usuários encontrados:</p>
                <div className="space-y-1">
                  {usuariosEncontrados.map((usuario) => (
                    <button
                      key={usuario._id}
                      onClick={() => handleSelecionarUsuario(usuario)}
                      className="w-full text-left p-4 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 rounded-xl border-2 border-gray-200 hover:border-cyan-300 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-[1.02]"
                    >
                      <p className="font-bold text-gray-800">{usuario.name}</p>
                      <p className="text-sm text-gray-600">@{usuario.login}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelarNovaConversa}
                className="px-6 py-3 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal de Confirmação */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
      />

      <Footer showMap={false} />
    </ProtectedRoute>
  );
}