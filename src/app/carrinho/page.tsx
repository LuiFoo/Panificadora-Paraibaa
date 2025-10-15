"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import OptimizedImage from "@/components/OptimizedImage";

import imagem_mais from "../../../public/images/car_mais.svg";
import imagem_menos from "../../../public/images/car_menos.svg";
import imagem_limpar from "../../../public/images/car_limpar.svg";

export default function CarrinhoPage() {
  const { cartItems, removeItem, updateItemQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState<boolean>(true);

  // O CartContext já carrega o carrinho; aqui só desligamos o loading
  useEffect(() => {
    setLoading(false);
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
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Meu Carrinho</h1>

        {cartItems.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* Ícone de carrinho vazio */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 rounded-full p-6">
                  <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>

              {/* Mensagem principal */}
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Seu carrinho está vazio
              </h2>
              <p className="text-gray-600 mb-8">
                Adicione produtos deliciosos da nossa padaria ao seu carrinho!
              </p>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/produtos"
                  className="inline-flex items-center justify-center gap-2 bg-[#B69B4C] hover:bg-[#9d8540] text-white px-8 py-4 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Ver Produtos
                </Link>

                <Link
                  href="/meus-pedidos"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Meus Pedidos
                </Link>
              </div>

              {/* Informações adicionais */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Quer fazer uma encomenda especial?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat Online
                  </Link>
                  
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
                    Fale Conosco
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cartItems.map((item) => {
                console.log("Item do carrinho:", item);
                return (
                  <div
                    key={item.id}
                    className="flex items-center bg-white shadow rounded-lg p-4 gap-4"
                  >
                    <div className="w-24 h-24 relative">
                      <OptimizedImage
                        src={item.img || "/images/default-product.png"}
                        alt={item.nome}
                        width={96}
                        height={96}
                        className="object-cover rounded"
                        quality={75}
                      />
                    </div>

                    <div className="flex-1">
                      <h2 className="font-bold text-lg">{item.nome}</h2>
                      <p className="text-gray-600">
                        R$
                        {item.valor.toFixed(2).replace(".", ",")} x{" "}
                        {item.quantidade}
                      </p>
                      <p className="font-semibold mt-1">
                        Subtotal: R$
                        {(item.valor * item.quantidade)
                          .toFixed(2)
                          .replace(".", ",")}
                      </p>

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateItemQuantity(item.id, item.quantidade - 1)
                          }
                          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                          title="Remover 1 unidade"
                        >
                          <Image src={imagem_menos} alt="-" width={20} height={20} />
                        </button>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 bg-red-500 rounded hover:bg-red-600 text-white"
                          title="Remover do carrinho"
                        >
                          <Image src={imagem_limpar} alt="x" width={20} height={20} />
                        </button>

                        <button
                          onClick={() =>
                            updateItemQuantity(item.id, item.quantidade + 1)
                          }
                          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                          title="Adicionar 1 unidade"
                        >
                          <Image src={imagem_mais} alt="+" width={20} height={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Informativo de Horário de Funcionamento */}
            <div className="mt-6 bg-amber-50 border border-amber-300 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-amber-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                ⏰ Horário para Pedidos
              </h3>
              <div className="text-sm text-amber-800 space-y-1">
                <p>✅ <strong>Segunda a Sábado:</strong> 07h às 18:30h</p>
                <p>❌ <strong>Domingo:</strong> NÃO fazemos pedidos</p>
                <p className="mt-2">📅 <strong>Prazo:</strong> Pedidos até 1 mês no futuro</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => clearCart()}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Limpar Carrinho
                </button>
                
                <Link
                  href="/meus-pedidos"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  📦 Meus Pedidos
                </Link>
              </div>

              <p className="text-xl font-bold">
                Total: R${total.toFixed(2).replace(".", ",")}
              </p>

              <Link
                href="/checkout"
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Finalizar Compra
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer showMap={false} />
    </>
  );
}
