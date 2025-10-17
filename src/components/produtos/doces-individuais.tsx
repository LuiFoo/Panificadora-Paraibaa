"use client";

import { useEffect, useState } from "react";

interface Doce {
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

export default function DocesIndividuaisPage() {
  const [docesIndividuais, setDocesIndividuais] = useState<Doce[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchDocesIndividuais() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar os doces individuais");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria doces
        setDocesIndividuais(data.doces || []);
      } catch (error) {
        console.error("Erro ao buscar doces individuais:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocesIndividuais();
  }, []);

  if (!isClient || loading) { // 🔹 Evita erro de SSR
    return <p>Carregando doces individuais...</p>;
  }

  return (
    <ul className="bg-blue-700">
      {docesIndividuais.length > 0 ? (
        docesIndividuais.map((doce) => (
          <li key={doce._id}>
            {doce.nome} - R${doce.preco.valor.toFixed(2).replace(".", ",")}
            {doce.preco.promocao?.ativo && (
              <span className="text-red-500 ml-2">
                (Promoção: R${doce.preco.promocao.valorPromocional.toFixed(2).replace(".", ",")})
              </span>
            )}
          </li>
        ))
      ) : (
        <p>Nenhum doce individual encontrado.</p>
      )}
    </ul>
  );
}
