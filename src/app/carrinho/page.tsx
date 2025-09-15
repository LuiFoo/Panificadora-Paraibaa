"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";

export default function CarrinhoPage() {
  const { cartItems, removeItem, clearCart } = useCart();

  // Calcula o total do carrinho
  const total = cartItems.reduce((sum, item) => sum + item.valor * item.quantidade, 0);

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Meu Carrinho</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">Seu carrinho está vazio.</p>
            <Link
              href="/produtos"
              className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Voltar para o Cardápio
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center bg-white shadow rounded-lg p-4 gap-4"
                >
                  {/* Imagem do produto */}
                  <div className="w-24 h-24 relative">
                    <Image
                      src={item.img || "/images/default-product.png"}
                      alt={item.nome}
                      fill
                      className="object-cover rounded"
                    />
                  </div>

                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{item.nome}</h2>
                    <p className="text-gray-600">
                      R${item.valor.toFixed(2).replace(".", ",")} x {item.quantidade}
                    </p>
                    <p className="font-semibold mt-1">
                      Subtotal: R${(item.valor * item.quantidade).toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 font-bold hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <button
                onClick={clearCart}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Limpar Carrinho
              </button>

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
