"use client";

import { useEffect, useState } from "react";

// interface Produto {
//   _id: string;
//   nome: string;
//   slug: string;
//   descricao: string;
//   categoria: {
//     nome: string;
//     slug: string;
//   };
//   subcategoria: string;
//   preco: {
//     valor: number;
//     tipo: string;
//     promocao?: {
//       ativo: boolean;
//       valorPromocional: number;
//     };
//   };
//   imagem: {
//     href: string;
//     alt: string;
//   };
//   avaliacao: {
//     media: number;
//     quantidade: number;
//   };
//   destaque: boolean;
//   tags: string[];
//   status: string;
// }

export default function PaesDocesPage() {
  const [paesDoces, setPaesDoces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchPaesDoces() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar os pães e doces");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria doces
        setPaesDoces(data.doces || []);
      } catch (error) {
        console.error("Erro ao buscar pães e doces:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPaesDoces();
  }, []);

  if (!isClient || loading) { // 🔹 Evita erro de SSR
    return <p>Carregando pães e doces...</p>;
  }

  return (
    <ul className="bg-blue-700">
      {paesDoces.length > 0 ? (
        paesDoces.map((paoDoce) => (
          <li key={paoDoce._id}>
            {paoDoce.nome} - R${paoDoce.preco.valor.toFixed(2).replace(".", ",")} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum pão ou doce encontrado.</p>
      )}
    </ul>
  );
}
