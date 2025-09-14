"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ItemCardapio {
  _id: string;
  nome: string;
  valor: number;
  img: string;
  subc: string;
  vtipo: string;
  ingredientes: string;
}

export default function Page() {
  const params = useParams<{ categoria: string; id: string }>();
  const categoria = params?.categoria;
  const id = params?.id;

  const [item, setItem] = useState<ItemCardapio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoria || !id) return;

    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/${categoria}`);
        if (!res.ok) throw new Error("Erro ao buscar dados da API");

        const data = await res.json();
        const itens = Object.values(data)[0] as ItemCardapio[];
        const encontrado = itens.find((i) => i._id === id) || null;

        setItem(encontrado);
      } catch (error) {
        console.error("Erro ao buscar item:", error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [categoria, id]);

  if (!categoria || !id || loading) {
    return <p className="text-center py-12">Carregando...</p>;
  }

  if (!item) {
    return (
      <p className="text-center py-12 text-red-500">
        Item não encontrado.
      </p>
    );
  }

  return (
    <>
      <Header />
        <div className="max-w-3xl mx-auto p-8">
      <Image
        src={item.img}
        alt={item.nome}
        width={400}
        height={400}
        className="mx-auto rounded mb-6"
      />
      <h1 className="text-3xl font-bold text-center mb-2">{item.nome}</h1>
      <p className="text-center text-gray-600 mb-4">{item.subc}</p>
      <p className="text-amber-600 font-bold text-center text-xl mb-6">
        A partir: R${item.valor.toFixed(2).replace(".", ",")} {item.vtipo}
      </p>
      <p className="text-center">{item.ingredientes}</p>
    </div>

    <Footer />
    </>

  );
}
