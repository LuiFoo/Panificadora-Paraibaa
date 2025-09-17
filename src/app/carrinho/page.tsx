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
  const { cartItems, removeItem, updateItemQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState<boolean>(true);

  // Função para carregar os produtos do MongoDB e sincronizar com o localStorage
  useEffect(() => {
    const fetchProducts = async () => {
      console.log("Buscando produtos do MongoDB...");
      try {
        const res = await fetch("/api/bolos-doces-especiais");
        if (!res.ok) {
          throw new Error("Erro ao buscar produtos");
        }

        const data: { bolosDocesEspeciais: Product[] } = await res.json();
        const products = data.bolosDocesEspeciais;

        console.log("Produtos carregados:", products);

        // Atualiza os itens do carrinho com os produtos do MongoDB
        const updatedItems = cartItems.map((item) => {
          const product = products.find((p) => p._id === item.id);
          if (!product) {
            console.log(`Produto não encontrado: ${item.id}`);
            return item; // Retorna item original caso o produto não seja encontrado
          }
          console.log(`Produto encontrado: ${item.id}`);
          return {
            ...item,
            nome: product.nome,
            valor: product.valor,
            img: product.img || "/images/default-product.png",
          };
        });

        // Atualiza o carrinho no localStorage e no estado
        localStorage.setItem("carrinho", JSON.stringify(updatedItems));
        setLoading(false);
        console.log("Carrinho atualizado com sucesso.");
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cartItems]);

  // Calcula o total do carrinho
  const total = cartItems.reduce(
    (sum, item) => sum + (item.valor || 0) * item.quantidade,
    0
  );

  // Se estiver carregando, exibe o estado de carregamento
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
              {cartItems.map((item) => (
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
                        onClick={() => updateItemQuantity(item.id, item.quantidade - 1)}
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
                        onClick={() => updateItemQuantity(item.id, item.quantidade + 1)}
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
