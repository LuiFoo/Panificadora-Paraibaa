"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import { useUser } from "@/context/UserContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Mensagem {
  _id: string;
  userId: string;
  userName: string;
  mensagem: string;
  remetente: "cliente" | "admin";
  dataEnvio: string;
  lida: boolean;
}

export default function ChatPage() {
  const { user } = useUser();
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
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

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      fetchMensagens();
      // Atualizar a cada 5 segundos
      const interval = setInterval(fetchMensagens, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMensagens = async () => {
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
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaMensagem.trim() || !user) return;

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
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Erro",
        message: "Erro ao enviar mensagem. Tente novamente."
      });
    } finally {
      setEnviando(false);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Redirecionando para login...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cabeçalho do Chat */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              💬 Chat com a Panificadora Paraíba
            </h1>
            <p className="text-sm text-amber-100 mt-1">
              Tire suas dúvidas ou faça pedidos especiais
            </p>
          </div>

          {/* Área de Mensagens */}
          <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
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
                      className={`max-w-[70%] rounded-lg p-3 ${
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
                      <p className="text-sm break-words">{msg.mensagem}</p>
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
          <form onSubmit={handleEnviarMensagem} className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={enviando}
              />
              <button
                type="submit"
                disabled={enviando || !novaMensagem.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
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
        </div>

        {/* Informações */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Responderemos sua mensagem o mais breve possível</li>
            <li>• Horário de atendimento: Segunda a Sábado, 6h às 19h</li>
            <li>• Você receberá notificações quando houver resposta</li>
          </ul>
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
    </>
  );
}

