"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PedidoTimeline from "@/components/PedidoTimeline";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Pedido } from "@/types/Pedido";

export default function MeusPedidosPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todos");
  const [buscaTexto, setBuscaTexto] = useState<string>("");
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPedidos();
    }
  }, [user]);

  const fetchPedidos = async () => {
    try {
      const response = await fetch(`/api/orders`);
      if (response.ok) {
        // 🐛 CORREÇÃO: Verificar se resposta é JSON válido antes de fazer parse
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setPedidos(data.pedidos || []);
        } else {
          console.error("Resposta não é JSON");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparando': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pronto': return 'bg-green-100 text-green-800 border-green-200';
      case 'entregue': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return '⏳ Pendente';
      case 'confirmado': return '✅ Confirmado';
      case 'preparando': return '👨‍🍳 Preparando';
      case 'pronto': return '🍞 Pronto';
      case 'entregue': return '🚚 Entregue';
      case 'cancelado': return '❌ Cancelado';
      default: return status;
    }
  };

  const getModalidadeText = (modalidade: string) => {
    return modalidade === 'entrega' ? '🚚 Entrega' : '🏪 Retirada';
  };

  const filteredPedidos = pedidos.filter(pedido => {
    // Filtro de status
    const matchStatus = filtroStatus === "todos" || pedido.status === filtroStatus;
    
    // Filtro de modalidade
    const matchModalidade = filtroModalidade === "todos" || pedido.modalidadeEntrega === filtroModalidade;
    
    // Filtro de busca (ID, produto ou endereço)
    const matchBusca = !buscaTexto || 
      pedido._id.includes(buscaTexto) ||
      pedido.produtos.some(p => p.nome.toLowerCase().includes(buscaTexto.toLowerCase())) ||
      (pedido.endereco && 
        `${pedido.endereco.rua} ${pedido.endereco.numero} ${pedido.endereco.bairro} ${pedido.endereco.cidade}`.toLowerCase().includes(buscaTexto.toLowerCase())
      );
    
    return matchStatus && matchModalidade && matchBusca;
  });

  if (loading || loadingPedidos) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Carregando seus pedidos...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-red-600 text-lg">Você precisa estar logado para ver seus pedidos.</p>
          <Link href="/login" className="mt-4 inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold">
            Fazer Login
          </Link>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Meus Pedidos</h1>
            <p className="text-gray-600 mt-1">Acompanhe o status dos seus pedidos</p>
          </div>
          <Link 
            href="/carrinho" 
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🛒 Ver Carrinho
          </Link>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔍</span>
            Filtros e Busca
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar:
              </label>
              <input
                type="text"
                placeholder="ID, produto ou endereço..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status:
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="todos">Todos</option>
                <option value="pendente">⏳ Pendentes</option>
                <option value="confirmado">✅ Confirmados</option>
                <option value="preparando">👨‍🍳 Preparando</option>
                <option value="pronto">🍞 Prontos</option>
                <option value="entregue">✨ Entregues</option>
                <option value="cancelado">❌ Cancelados</option>
              </select>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade:
              </label>
              <select
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="todos">Todas</option>
                <option value="entrega">🚚 Entrega</option>
                <option value="retirada">🏪 Retirada</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>{filteredPedidos.length}</strong> {filteredPedidos.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
              {buscaTexto && (
                <button
                  onClick={() => setBuscaTexto("")}
                  className="ml-2 text-amber-600 hover:text-amber-700 font-medium text-xs"
                >
                  Limpar busca
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-600 mb-4">
                {filtroStatus === "todos" 
                  ? "Você ainda não fez nenhum pedido." 
                  : "Nenhum pedido com este status."
                }
              </p>
              <Link
                href="/produtos"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
              >
                Ver Produtos
              </Link>
            </div>
          ) : (
            filteredPedidos.map((pedido) => (
              <div key={pedido._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* Cabeçalho do Pedido */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setPedidoExpandido(pedidoExpandido === pedido._id ? null : pedido._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">Pedido #{pedido.numeroPedido || pedido._id.slice(-6)}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(pedido.status)}`}>
                          {getStatusText(pedido.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <p>📅 {new Date(pedido.dataPedido).toLocaleString('pt-BR')}</p>
                        <p>{getModalidadeText(pedido.modalidadeEntrega)}</p>
                        <p>📦 {pedido.produtos.length} {pedido.produtos.length === 1 ? 'item' : 'itens'}</p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-amber-600">
                        R$ {pedido.total.toFixed(2).replace(".", ",")}
                      </p>
                      <button className="mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        {pedidoExpandido === pedido._id ? '▲ Recolher' : '▼ Ver detalhes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {pedidoExpandido === pedido._id && (
                  <div className="px-6 pb-6 border-t border-gray-200 pt-4 space-y-4">
                    {/* Timeline de Status */}
                    <PedidoTimeline 
                      statusAtual={pedido.status}
                      modalidade={pedido.modalidadeEntrega}
                      historico={pedido.historico}
                    />

                    {/* Produtos */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="font-medium mb-3 text-gray-800 flex items-center gap-2">
                        <span>🛍️</span>
                        Produtos do Pedido
                      </h4>
                      <div className="space-y-2">
                        {pedido.produtos.map((produto, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">{produto.nome}</span>
                              <span className="text-sm text-gray-500 ml-2">x{produto.quantidade}</span>
                            </div>
                            <span className="font-semibold text-gray-800">
                              R$ {(produto.valor * produto.quantidade).toFixed(2).replace(".", ",")}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t-2 border-gray-300 flex justify-between items-center">
                          <span className="font-bold text-gray-800">Total:</span>
                          <span className="font-bold text-xl text-amber-600">
                            R$ {pedido.total.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Endereço - apenas para entrega */}
                    {pedido.modalidadeEntrega === 'entrega' && pedido.endereco && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-green-900 flex items-center gap-2">
                          <span>🚚</span>
                          Endereço de Entrega
                        </h4>
                        <div className="text-sm text-green-800 space-y-1">
                          <p><strong>Rua:</strong> {pedido.endereco.rua}, {pedido.endereco.numero}</p>
                          <p><strong>Bairro:</strong> {pedido.endereco.bairro}</p>
                          <p><strong>Cidade:</strong> {pedido.endereco.cidade}</p>
                          <p><strong>CEP:</strong> {pedido.endereco.cep}</p>
                          {pedido.endereco.complemento && (
                            <p><strong>Complemento:</strong> {pedido.endereco.complemento}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informação de Retirada */}
                    {pedido.modalidadeEntrega === 'retirada' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-blue-900 flex items-center gap-2">
                          <span>🏪</span>
                          Retirada no Local
                        </h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>Retire seu pedido na panificadora</p>
                          {pedido.dataRetirada && pedido.horaRetirada && (
                            <p className="font-medium mt-2">
                              <strong>📅 Data e Hora:</strong> {new Date(pedido.dataRetirada + 'T' + pedido.horaRetirada).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    {pedido.observacoes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-yellow-900 flex items-center gap-2">
                          <span>📝</span>
                          Observações
                        </h4>
                        <p className="text-sm text-yellow-800">{pedido.observacoes}</p>
                      </div>
                    )}

                    {/* Informações de Contato */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-gray-800">Informações de Contato</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>📞 <strong>Telefone:</strong> {pedido.telefone}</p>
                        <p>🕐 <strong>Última atualização:</strong> {new Date(pedido.ultimaAtualizacao).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex gap-2 pt-2">
                      <a
                        href={`https://api.whatsapp.com/send?phone=551636151947&text=Olá! Gostaria de saber sobre o pedido #${pedido.numeroPedido || pedido._id.slice(-6)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-center text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        💬 Falar pelo WhatsApp
                      </a>
                      <Link
                        href="/chat"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        💬 Chat Online
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      <Footer showMap={false} />
    </>
  );
}
