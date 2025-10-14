"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Modal from "@/components/Modal";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

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

export default function MensagensAdminPage() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
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

  // Definir conversaAtual antes dos useEffects
  const conversaAtual = conversas.find(c => c.userId === conversaSelecionada);

  useEffect(() => {
    fetchConversas();
    // Atualizar a cada 5 segundos
    const interval = setInterval(fetchConversas, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Marcar mensagens do cliente como lidas quando admin abre a conversa
    if (conversaSelecionada) {
      marcarComoLida(conversaSelecionada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaSelecionada]);

  // Scroll automático apenas quando as mensagens da conversa atual mudarem
  useEffect(() => {
    if (conversaAtual && conversaAtual.mensagens.length > 0) {
      scrollToBottom();
    }
  }, [conversaAtual?.mensagens]);

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
      
      // Aguardar um pouco e buscar conversas atualizadas
      setTimeout(() => {
        fetchConversas();
        window.dispatchEvent(new Event('refreshMensagensCount'));
      }, 500);
    } catch (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const fetchConversas = async () => {
    try {
      const response = await fetch("/api/mensagens?isAdmin=true");
      const data = await response.json();
      
      if (data.success) {
        // Ordenar conversas pela data da última mensagem (mais recente primeiro)
        const conversasOrdenadas = data.conversas.sort((a: Conversa, b: Conversa) => {
          return new Date(b.ultimaMensagem).getTime() - new Date(a.ultimaMensagem).getTime();
        });
        setConversas(conversasOrdenadas);
      }
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaMensagem.trim() || !conversaSelecionada) return;

    setEnviando(true);
    
    try {
      const conversa = conversas.find(c => c.userId === conversaSelecionada);
      if (!conversa) return;

      const response = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: conversaSelecionada,
          userName: conversa.userName,
          mensagem: novaMensagem,
          remetente: "admin"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNovaMensagem("");
        await fetchConversas();
        
        // Atualizar contador no header
        window.dispatchEvent(new Event('refreshMensagensCount'));
      }
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Erro",
        message: "Erro ao enviar resposta. Tente novamente."
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleDeletarConversa = () => {
    if (!conversaSelecionada) return;

    const conversa = conversas.find(c => c.userId === conversaSelecionada);
    
    setModalState({
      isOpen: true,
      type: "warning",
      title: "⚠️ Confirmar Exclusão",
      message: `Tem certeza que deseja deletar toda a conversa com ${conversa?.userName}? Esta ação não pode ser desfeita.`,
      onConfirm: confirmarDeletarConversa
    });
  };

  const confirmarDeletarConversa = async () => {
    if (!conversaSelecionada) return;

    try {
      const response = await fetch(`/api/mensagens?userId=${conversaSelecionada}`, {
        method: "DELETE"
      });

      const data = await response.json();
      
      if (data.success) {
        setModalState({
          isOpen: true,
          type: "success",
          title: "✅ Sucesso",
          message: data.message
        });

        // Limpar seleção e atualizar lista
        setConversaSelecionada(null);
        await fetchConversas();
        
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

  const totalNaoLidas = conversas.reduce((sum, c) => sum + c.naoLidas, 0);

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <Link 
                href="/painel" 
                className="text-white hover:text-blue-100 text-sm mb-2 inline-flex items-center"
              >
                ← Voltar ao Painel
              </Link>
              <h1 className="text-3xl font-bold flex items-center gap-2 mt-2">
                💬 Mensagens dos Clientes
              </h1>
              <p className="text-blue-100 mt-1">
                {totalNaoLidas > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded-full text-xs font-bold mr-2">
                    {totalNaoLidas} nova{totalNaoLidas > 1 ? 's' : ''}
                  </span>
                )}
                Responda as mensagens dos seus clientes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Lista de Conversas */}
              <div className="border-r border-gray-200 overflow-y-auto bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <h2 className="font-semibold text-gray-800">
                    Conversas ({conversas.length})
                  </h2>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : conversas.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-gray-500 text-sm">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {conversas.map((conversa) => (
                      <button
                        key={conversa.userId}
                        onClick={() => setConversaSelecionada(conversa.userId)}
                        className={`w-full p-4 text-left hover:bg-gray-100 transition-colors ${
                          conversaSelecionada === conversa.userId ? "bg-blue-50 border-l-4 border-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                              {conversa.userName}
                              {conversa.naoLidas > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                  {conversa.naoLidas}
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              @{conversa.userId}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(conversa.ultimaMensagem).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Área de Chat */}
              <div className="md:col-span-2 flex flex-col">
                {!conversaSelecionada ? (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Selecione uma conversa
                      </h3>
                      <p className="text-gray-500">
                        Escolha um cliente à esquerda para ver as mensagens
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header da Conversa */}
                    <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {conversaAtual?.userName}
                        </h3>
                        <p className="text-xs text-gray-500">@{conversaAtual?.userId}</p>
                      </div>
                      <button
                        onClick={handleDeletarConversa}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        title="Deletar conversa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Deletar Conversa
                      </button>
                    </div>

                    {/* Mensagens */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
                      <div className="space-y-4">
                        {conversaAtual?.mensagens.map((msg) => (
                          <div
                            key={msg._id}
                            className={`flex ${
                              msg.remetente === "admin" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.remetente === "admin"
                                  ? "bg-blue-500 text-white"
                                  : "bg-white border border-gray-200 text-gray-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold">
                                  {msg.remetente === "admin" ? "🍞 Você (Padaria)" : "👤 Cliente"}
                                </span>
                              </div>
                              <p className="text-sm break-words">{msg.mensagem}</p>
                              <span
                                className={`text-xs mt-1 block ${
                                  msg.remetente === "admin"
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {new Date(msg.dataEnvio).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Formulário de Resposta */}
                    <form onSubmit={handleEnviarResposta} className="border-t border-gray-200 p-4 bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={novaMensagem}
                          onChange={(e) => setNovaMensagem(e.target.value)}
                          placeholder="Digite sua resposta..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={enviando}
                        />
                        <button
                          type="submit"
                          disabled={enviando || !novaMensagem.trim()}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          {enviando ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Enviar
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
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
        confirmText="OK"
      />
    </ProtectedRoute>
  );
}

