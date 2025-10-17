"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import ErrorModal from "@/components/ErrorModal";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useUser } from "@/context/UserContext";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Mensagem {
  _id: string;
  userId: string;
  userName: string;
  mensagem: string;
  remetente: "cliente" | "admin";
  dataEnvio: string;
  lida: boolean;
}

function ChatContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // Verificar se o usuário veio da página fale-conosco
  const fromFaleConosco = searchParams?.get('from') === 'fale-conosco';
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
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: ""
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMensagens = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/mensagens?userId=${user.login}`);
      const data = await response.json();
      
      if (data.success) {
        setMensagens(data.mensagens);
        
        // Marcar mensagens do admin como lidas
        const naoLidas = data.mensagens.filter(
          (m: Mensagem) => !m.lida && m.remetente === "admin"
        );
        
        if (naoLidas.length > 0) {
          await fetch("/api/mensagens", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.login,
              marcarComoLida: true
            })
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMensagens();
      
      // Polling inteligente - só quando a página está visível
      let interval: NodeJS.Timeout;
      
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearInterval(interval);
        } else {
          // Página ficou visível, buscar mensagens imediatamente
          fetchMensagens();
          // Reiniciar polling
          interval = setInterval(fetchMensagens, 30000);
        }
      };
      
      // Iniciar polling se página estiver visível
      if (!document.hidden) {
        interval = setInterval(fetchMensagens, 30000);
      }
      
      // Escutar mudanças de visibilidade
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      setLoading(false);
    }
  }, [user, fetchMensagens]);

  // Scroll automático removido - não queremos scroll automático

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaMensagem.trim() || !user || enviando) return;

    setEnviando(true);
    
    try {
      const response = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.login,
          userName: user.name,
          mensagem: novaMensagem,
          remetente: "cliente"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNovaMensagem("");
        fetchMensagens();
        
        // Disparar evento para atualizar contador no header
        window.dispatchEvent(new Event('refreshMensagensCount'));
        
        // Manter foco no campo de input após enviar
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else {
        // Verificar se é erro de acesso negado para usar o modal específico
        if (data.error && data.error.includes("Acesso negado")) {
          setErrorModal({
            isOpen: true,
            title: "Erro",
            message: data.error
          });
        } else {
          setModalState({
            isOpen: true,
            type: "error",
            title: "Erro",
            message: data.error || "Erro ao enviar mensagem. Tente novamente."
          });
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      let errorMessage = "Erro ao enviar mensagem. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (error.message.includes('500')) {
          errorMessage = "Erro interno do servidor. Tente novamente em alguns instantes.";
        } else if (error.message.includes('Acesso negado')) {
          errorMessage = "Acesso negado. Apenas administradores podem acessar esta API.";
        }
      }
      
      // Verificar se é erro de acesso negado para usar o modal específico
      if (errorMessage.includes("Acesso negado")) {
        setErrorModal({
          isOpen: true,
          title: "Erro",
          message: errorMessage
        });
      } else {
        setModalState({
          isOpen: true,
          type: "error",
          title: "Erro",
          message: errorMessage
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 p-2 md:p-4">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb - só aparece quando vem do fale-conosco */}
            {fromFaleConosco && (
              <BreadcrumbNav 
                items={[
                  { label: "Fale Conosco", href: "/fale-conosco", icon: "📞", color: "blue" },
                  { label: "Chat", icon: "💬", color: "green" }
                ]}
              />
            )}
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Cabeçalho do Chat */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  💬 Chat com a Panificadora Paraíba
                </h1>
                <p className="text-sm text-amber-100 mt-1">
                  Faça login para conversar conosco
                </p>
              </div>

            {/* Conteúdo */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-block bg-amber-100 rounded-full p-6 mb-4">
                  <svg className="w-16 h-16 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Entre para conversar conosco
                </h2>
                <p className="text-gray-600 mb-6">
                  Para usar o chat online, você precisa estar logado na sua conta.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Fazer Login
                </Link>

                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center gap-2 bg-white text-amber-600 border-2 border-amber-600 hover:bg-amber-50 px-8 py-4 rounded-lg font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Criar Conta
                </Link>
              </div>

              {/* Alternativas de contato */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">Ou entre em contato por:</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="https://api.whatsapp.com/send?phone=551636151947"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>

                  <Link
                    href="/fale-conosco"
                    className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Outros Contatos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 p-2 md:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb - só aparece quando vem do fale-conosco */}
          {fromFaleConosco && (
            <BreadcrumbNav 
              items={[
                { label: "Fale Conosco", href: "/fale-conosco", icon: "📞", color: "blue" },
                { label: "Chat", icon: "💬", color: "green" }
              ]}
            />
          )}
          
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-3 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-lg md:text-2xl font-bold text-gray-800">Chat com a Panificadora Paraíba</h1>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      💬 Chat
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tire suas dúvidas ou faça pedidos especiais
                  </p>
                </div>
              </div>
            </div>

          {/* Área de Mensagens */}
          <div 
            className="overflow-y-auto overflow-x-hidden p-2 md:p-4 bg-gray-50 chat-container" 
            style={{ 
              height: "calc(100vh - 180px)", 
              minHeight: "300px", 
              maxHeight: "calc(100vh - 180px)"
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                  <p className="text-gray-600 mt-4">Carregando mensagens...</p>
                </div>
              </div>
            ) : mensagens.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Inicie uma conversa!
                  </h3>
                  <p className="text-gray-500">
                    Envie sua primeira mensagem para a padaria
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {mensagens.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.remetente === "cliente" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] rounded-lg p-2 md:p-3 chat-message ${
                        msg.remetente === "cliente"
                          ? "bg-amber-500 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {msg.remetente === "cliente" ? "Você" : "🍞 Panificadora"}
                        </span>
                      </div>
                      <p className="text-sm md:text-sm break-words" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.mensagem}
                      </p>
                      <span
                        className={`text-xs mt-1 block ${
                          msg.remetente === "cliente"
                            ? "text-amber-100"
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
            )}
          </div>

          {/* Formulário de Envio */}
          <form onSubmit={handleEnviarMensagem} className="border-t border-gray-200 p-2 md:p-4 bg-white">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setNovaMensagem(e.target.value);
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={enviando}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${novaMensagem.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                    {novaMensagem.length}/500 caracteres
                  </span>
                  {novaMensagem.length > 450 && (
                    <span className="text-xs text-red-500 font-medium">
                      Limite próximo!
                    </span>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={enviando || !novaMensagem.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white px-3 md:px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base"
              >
                {enviando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden md:inline">Enviando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="hidden md:inline">Enviar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informações */}
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm md:text-base">ℹ️ Informações</h3>
          <ul className="text-xs md:text-sm text-blue-800 space-y-1">
            <li>• Responderemos sua mensagem o mais breve possível</li>
            <li>• Horário de atendimento: Segunda a Sábado, 6h às 19h</li>
            <li>• Você receberá notificações quando houver resposta</li>
          </ul>
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
        confirmText="OK"
      />

      {/* Modal de Erro com design similar ao Nova Conversa */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        confirmText="OK"
      />
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 p-2 md:p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando chat...</p>
            </div>
          </div>
        </main>
        <Footer showMap={false} />
      </>
    }>
      <ChatContent />
    </Suspense>
  );
}

