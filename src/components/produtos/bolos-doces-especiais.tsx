"use client";

import { useEffect, useState } from "react";

interface Bolo {
  _id: string;
  nome: string;
  slug: string;
  descricao: string;
  categoria: {
    nome: string;
    slug: string;
  };
  subcategoria: string;
  preco: {
    valor: number;
    tipo: string;
    promocao?: {
      ativo: boolean;
      valorPromocional: number;
    };
  };
  imagem: {
    href: string;
    alt: string;
  };
  avaliacao: {
    media: number;
    quantidade: number;
  };
  destaque: boolean;
  tags: string[];
  status: string;
}

export default function BolosDocesEspeciaisPage() {
  const [bolosDoces, setBolosDoces] = useState<Bolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchBolosDoces() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar os bolos e doces especiais");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria doces
        setBolosDoces(data.doces || []);
      } catch (error) {
        console.error("Erro ao buscar bolos e doces especiais:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBolosDoces();
  }, []);

  if (!isClient || loading) { // 🔹 Evita erro de SSR
    return <p>Carregando bolos e doces especiais...</p>;
  }

  return (
    <ul className="bg-blue-700">
      {bolosDoces.length > 0 ? (
        bolosDoces.map((bolo) => (
          <li key={bolo._id}>
            {bolo.nome} - R${bolo.preco.valor.toFixed(2).replace(".", ",")}
            {bolo.preco.promocao?.ativo && (
              <span className="text-red-500 ml-2">
                (Promoção: R${bolo.preco.promocao.valorPromocional.toFixed(2).replace(".", ",")})
              </span>
            )}
          </li>
        ))
      ) : (
        <p>Nenhum bolo ou doce especial encontrado.</p>
      )}
    </ul>
  );
}
