"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import OptimizedImage from "@/components/OptimizedImage";

export default function CarrinhoPage() {
  const { cartItems, removeItem, updateItemQuantity, clearCart } = useCart();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const total = cartItems.reduce(
    (sum, item) => sum + (item.valor || 0) * item.quantidade,
    0
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <Loading size="lg" text="Carregando carrinho..." />
          </div>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <BreadcrumbNav 
            items={[
              { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
              { label: "Carrinho", icon: "🛒", color: "green" }
            ]}
          />

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  🛒 Meu Carrinho
                </h1>
                <p className="text-gray-600">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'} no carrinho
                </p>
              </div>
              
              {user && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Logado como:</p>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                </div>
              )}
            </div>
          </div>

          {cartItems.length === 0 ? (
            /* Carrinho Vazio */
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Seu carrinho está vazio
                </h2>
                <p className="text-gray-600 mb-8">
                  Adicione produtos deliciosos da nossa padaria ao seu carrinho!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/produtos"
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Ver Produtos
                  </Link>

                  <Link
                    href="/meus-pedidos"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Meus Pedidos
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Carrinho com Itens */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Produtos */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="flex items-center gap-4 p-6">
                      {/* Imagem */}
                      <div className="w-20 h-20 relative flex-shrink-0 rounded-xl overflow-hidden shadow-md">
                        <OptimizedImage
                          src={item.img || "/images/default-product.png"}
                          alt={item.nome}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                          quality={75}
                        />
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                          {item.nome}
                        </h3>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            R$ {item.valor.toFixed(2).replace(".", ",")} x {item.quantidade}
                          </p>
                          <p className="font-bold text-xl text-green-600 mt-1">
                            Subtotal: R$ {(item.valor * item.quantidade).toFixed(2).replace(".", ",")}
                          </p>
                        </div>

                        {/* Controles */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantidade - 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                            title="Remover 1 unidade"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>

                          <span className="w-12 h-8 bg-gray-50 rounded-lg flex items-center justify-center font-semibold text-gray-700">
                            {item.quantidade}
                          </span>

                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantidade + 1)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                            title="Adicionar 1 unidade"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 ml-2"
                            title="Remover do carrinho"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar - Resumo e Ações */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  {/* Resumo do Pedido */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      📋 Resumo do Pedido
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">
                              {item.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantidade}x R$ {item.valor.toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            R$ {(item.valor * item.quantidade).toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-green-600">
                          R$ {total.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      ⚡ Ações
                    </h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => clearCart()}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        🗑️ Limpar Carrinho
                      </button>
                      
                      <Link
                        href="/meus-pedidos"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center block"
                      >
                        📦 Meus Pedidos
                      </Link>
                    </div>
                  </div>

                  {/* Checkout */}
                  <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl shadow-xl p-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">
                        🚀 Finalizar Compra
                      </h3>
                      <p className="text-green-100 mb-4">
                        Total: R$ {total.toFixed(2).replace(".", ",")}
                      </p>
                      
                      <Link
                        href="/checkout"
                        className="w-full bg-white hover:bg-gray-100 text-green-600 px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center block"
                      >
                        Finalizar Compra →
                      </Link>
                    </div>
                  </div>

                  {/* Informações de Horário */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4">
                    <h4 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                      ⏰ Horário para Pedidos
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-amber-900">
                        ✅ <strong>Segunda a Sábado:</strong> 07h às 18:30h
                      </p>
                      <p className="text-amber-900">
                        ❌ <strong>Domingo:</strong> NÃO fazemos pedidos
                      </p>
                      <p className="text-amber-900">
                        📅 <strong>Prazo:</strong> Pedidos até 1 mês no futuro
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer showMap={false} />
    </>
  );
}