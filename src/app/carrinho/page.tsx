"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Loading from "@/components/Loading";
import OptimizedImage from "@/components/OptimizedImage";

import imagem_mais from "../../../public/images/car_mais.svg";
import imagem_menos from "../../../public/images/car_menos.svg";
import imagem_limpar from "../../../public/images/car_limpar.svg";

export default function CarrinhoPage() {
  const { cartItems, removeItem, updateItemQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // O CartContext já carrega o carrinho; aqui só desligamos o loading
  useEffect(() => {
    setLoading(false);
  }, []);

  // Observer para animações
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (mainRef.current) {
      observer.observe(mainRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Total do carrinho
  const total = cartItems.reduce(
    (sum, item) => sum + (item.valor || 0) * item.quantidade,
    0
  );


  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10">
          <Loading size="lg" text="Carregando carrinho..." />
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main ref={mainRef} className="bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <section className="py-2 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-fonte-100)] mb-2"
                style={{ fontFamily: "var(--fonte-secundaria)" }}
              >
                Meu Carrinho
              </h1>
              <p className="text-[var(--color-alavaco-100)] text-sm md:text-base">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'} no carrinho
              </p>
            </div>
          </div>
        </section>

        {/* Conteúdo Principal */}
        <section className="py-8 md:py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {cartItems.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
                  {/* Ícone de carrinho vazio */}
                  <div className="flex justify-center mb-8">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8">
                      <svg className="w-24 h-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>

                  {/* Mensagem principal */}
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                    Seu carrinho está vazio
                  </h2>
                  <p className="text-gray-600 mb-8 text-lg">
                    Adicione produtos deliciosos da nossa padaria ao seu carrinho!
                  </p>

                  {/* Botões de ação */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Link
                      href="/produtos"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] hover:from-[var(--color-avocado-700)] hover:to-[var(--color-avocado-600)] text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Ver Produtos
                    </Link>

                    <Link
                      href="/meus-pedidos"
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Meus Pedidos
                    </Link>
                  </div>

                  {/* Informações adicionais */}
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-base text-gray-600 mb-4 font-semibold">
                      Quer fazer uma encomenda especial?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link
                        href="/chat"
                        className="inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-base hover:underline"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat Online
                      </Link>
                      
                      <a
                        href="https://api.whatsapp.com/send?phone=551636151947"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-semibold text-base hover:underline"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </a>

                      <Link
                        href="/fale-conosco"
                        className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-base hover:underline"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Fale Conosco
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
        ) : (
          <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cartItems.map((item) => {
                  console.log("Item do carrinho:", item);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                    >
                      <div className="flex items-center gap-4 p-4 md:p-6">
                        {/* Imagem */}
                        <div className="w-24 h-24 md:w-28 md:h-28 relative flex-shrink-0 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                          <OptimizedImage
                            src={item.img || "/images/default-product.png"}
                            alt={item.nome}
                            width={112}
                            height={112}
                            className="object-cover w-full h-full"
                            quality={75}
                          />
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-base md:text-lg text-gray-800 mb-2 line-clamp-2">
                            {item.nome}
                          </h2>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">
                              R$ {item.valor.toFixed(2).replace(".", ",")} x {item.quantidade}
                            </p>
                            <p className="font-bold text-lg text-[var(--color-avocado-600)] mt-1">
                              Subtotal: R$ {(item.valor * item.quantidade).toFixed(2).replace(".", ",")}
                            </p>
                          </div>

                          {/* Controles */}
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantidade - 1)
                              }
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                              title="Remover 1 unidade"
                            >
                              <Image src={imagem_menos} alt="-" width={16} height={16} />
                            </button>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                              title="Remover do carrinho"
                            >
                              <Image src={imagem_limpar} alt="x" width={16} height={16} className="brightness-0 invert" />
                            </button>

                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantidade + 1)
                              }
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all transform hover:scale-110"
                              title="Adicionar 1 unidade"
                            >
                              <Image src={imagem_mais} alt="+" width={16} height={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informativo de Horário */}
              <div className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6">
                <h3 className="text-lg md:text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  ⏰ Horário para Pedidos
                </h3>
                <div className="bg-white rounded-xl p-4 space-y-2">
                  <p className="text-base text-amber-900">✅ <strong>Segunda a Sábado:</strong> 07h às 18:30h</p>
                  <p className="text-base text-amber-900">❌ <strong>Domingo:</strong> NÃO fazemos pedidos</p>
                  <p className="text-base text-amber-900 mt-3">📅 <strong>Prazo:</strong> Pedidos até 1 mês no futuro</p>
                </div>
              </div>

              {/* Ações e Total */}
              <div className="mt-8 space-y-6">
                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => clearCart()}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Limpar Carrinho
                  </button>
                  
                  
                  <Link
                    href="/meus-pedidos"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    📦 Meus Pedidos
                  </Link>
                </div>

                {/* Total e Checkout */}
                <div className="bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] rounded-2xl p-6 shadow-2xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-white/90 text-sm md:text-base">Total do Pedido</p>
                      <p className="text-3xl md:text-4xl font-bold text-white">
                        R$ {total.toFixed(2).replace(".", ",")}
                      </p>
                    </div>

                    <Link
                      href="/checkout"
                      className="w-full sm:w-auto bg-white hover:bg-gray-100 text-[var(--color-avocado-600)] px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
                    >
                      Finalizar Compra →
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </section>
      </main>

      <Footer showMap={false} />
    </>
  );
}
