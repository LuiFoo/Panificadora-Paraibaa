"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import imagem_mais from "../../../public/images/car_mais.svg";
import imagem_menos from "../../../public/images/car_menos.svg";
import imagem_limpar from "../../../public/images/car_limpar.svg";

interface Product {
  _id: string;
  nome: string;
  valor: number;
  img?: string;
}

export default function CarrinhoPage() {
  const { cartItems, removeItem, updateItemQuantity, updateCart, clearCart } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pega o estado atual do carrinho na montagem
    const currentCart = [...cartItems];

    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/bolos-doces-especiais");
        if (!res.ok) throw new Error("Erro ao buscar produtos");
        const data: { bolosDocesEspeciais: Product[] } = await res.json();
        const products = data.bolosDocesEspeciais;

        // Filtra e atualiza apenas os produtos válidos
        const updatedItems = currentCart
          .map(item => {
            const product = products.find(p => p._id === item.id);
            if (!product) return null;
            return {
              ...item,
              nome: product.nome,
              valor: product.valor,
              img: product.img || "/images/default-product.png",
            };
          })
          .filter(Boolean);

        updateCart(updatedItems as typeof cartItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Dependências vazias → roda apenas uma vez ao entrar no carrinho

  const removerUmaUnidade = (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    if (item.quantidade === 1) {
      removeItem(itemId);
    } else {
      updateItemQuantity(itemId, item.quantidade - 1);
    }
  };

  const adicionarUmaUnidade = (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    updateItemQuantity(itemId, item.quantidade + 1);
  };

  const total = cartItems.reduce(
    (sum, item) => sum + (item.valor || 0) * item.quantidade,
    0
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Atualizando carrinho...</p>
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
              {cartItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center bg-white shadow rounded-lg p-4 gap-4"
                >
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

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => removerUmaUnidade(item.id)}
                        className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                        title="Remover 1 unidade"
                      >
                        <Image src={imagem_menos} alt="-" width={20} height={20} />
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 bg-red-500 rounded hover:bg-red-600 text-white"
                        title="Remover tudo"
                      >
                        <Image src={imagem_limpar} alt="x" width={20} height={20} />
                      </button>

                      <button
                        onClick={() => adicionarUmaUnidade(item.id)}
                        className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                        title="Adicionar 1 unidade"
                      >
                        <Image src={imagem_mais} alt="+" width={20} height={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <button
                onClick={() => clearCart()}
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
