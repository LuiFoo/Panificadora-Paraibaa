"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/Modal";
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
  const [buscaTimeout, setBuscaTimeout] = useState<NodeJS.Timeout | null>(null);
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

  // Fetch inicial das conversas
  useEffect(() => {
    fetchConversas();
    
    // Polling inteligente - só quando a página está visível
    let interval: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        // Página ficou visível, buscar conversas imediatamente
        fetchConversas();
        // Reiniciar polling
        interval = setInterval(fetchConversas, 30000);
      }
    };
    
    // Iniciar polling se página estiver visível
    if (!document.hidden) {
      interval = setInterval(fetchConversas, 30000);
    }
    
    // Escutar mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Limpar timeout se existir
      if (buscaTimeout) {
        clearTimeout(buscaTimeout);
      }
    };
  }, [buscaTimeout, fetchConversas]);

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

      const data = await response.json();
      
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
      const response = await fetch(`/api/buscar-usuarios?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsuariosEncontrados(data.usuarios || []);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setBuscandoUsuarios(false);
    }
  }, []);

  // Função para abrir perfil do cliente
  const handleAbrirPerfilCliente = (userId: string) => {
    // Navegar para a página do perfil do cliente
    window.location.href = `/painel/cliente/${userId}`;
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
    if (buscaTimeout) {
      clearTimeout(buscaTimeout);
      setBuscaTimeout(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando mensagens...</p>
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
      <main className="min-h-screen bg-gray-50 p-2 md:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <button
                  onClick={() => router.push('/painel')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Painel
                </button>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-800 font-medium">Mensagens</span>
              </li>
            </ol>
          </nav>
          
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-3 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-lg md:text-2xl font-bold text-gray-800">Mensagens dos Clientes</h1>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      💬 Chat
                    </span>
                  </div>
                  <p className="text-gray-600">Gerencie as conversas com os clientes</p>
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
                    onClick={handleNovaConversa}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base w-full md:w-auto"
                  >
                    + Nova Conversa
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Conversas com Sistema de Expansão */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden w-full">
              {(conversas.length === 0 && !conversaTemporaria) ? (
                <div className="p-3 md:p-4 text-center text-gray-500">
                  <p className="text-sm md:text-base">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                <div className="space-y-2 relative">
                  {/* Incluir conversa temporária se existir */}
                  {conversaTemporaria && (
                    <div key={conversaTemporaria.userId} className="border border-gray-200 rounded-xl conversa-container shadow-sm hover:shadow-md transition-all duration-200">
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
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm md:text-base">
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
                                className="text-red-600 hover:text-red-700 text-xs md:text-sm font-medium"
                              >
                                Deletar Conversa
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
                                  className="flex-1 px-4 py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                  disabled={enviando}
                                />
                                <button
                                  type="submit"
                                  disabled={enviando || !novaMensagem.trim()}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm md:text-base shadow-md hover:shadow-lg disabled:shadow-none"
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
                    <div key={conversa.userId} className="border border-gray-200 rounded-xl conversa-container shadow-sm hover:shadow-md transition-all duration-200">
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
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm md:text-base">
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
                                className="text-red-600 hover:text-red-700 text-xs md:text-sm font-medium"
                              >
                                Deletar Conversa
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
                                  className="flex-1 px-4 py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                  disabled={enviando}
                                />
                                <button
                                  type="submit"
                                  disabled={enviando || !novaMensagem.trim()}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm md:text-base shadow-md hover:shadow-lg disabled:shadow-none"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
            <h3 className="text-base md:text-lg font-semibold mb-4">Nova Conversa</h3>
            
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
                  if (buscaTimeout) {
                    clearTimeout(buscaTimeout);
                  }
                  
                  if (value.trim()) {
                    // Debounce de 300ms
                    const timeout = setTimeout(() => {
                      handleBuscarUsuarios(value);
                    }, 300);
                    setBuscaTimeout(timeout);
                  } else {
                    setUsuariosEncontrados([]);
                  }
                }}
                placeholder="Digite o nome ou login do usuário..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
                      className="w-full text-left p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <p className="font-medium">{usuario.name}</p>
                      <p className="text-sm text-gray-600">@{usuario.login}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelarNovaConversa}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
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