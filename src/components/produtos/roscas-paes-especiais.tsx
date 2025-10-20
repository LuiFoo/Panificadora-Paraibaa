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

export default function RoscasPaesEspeciaisPage() {
  const [roscasPaesEspeciais, setRoscasPaesEspeciais] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchRoscasPaesEspeciais() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar as roscas e pães especiais");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria paes
        setRoscasPaesEspeciais(data.paes || []);
      } catch (error) {
        console.error("Erro ao buscar roscas e pães especiais:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRoscasPaesEspeciais();
  }, []);

  if (!isClient || loading) { // 🔹 Evita erro de SSR
    return <p>Carregando roscas e pães especiais...</p>;
  }

  return (
    <ul className="bg-blue-700">
      {roscasPaesEspeciais.length > 0 ? (
        roscasPaesEspeciais.map((roscaPao) => (
          <li key={roscaPao._id}>
            {roscaPao.nome} - R${roscaPao.preco.valor.toFixed(2).replace(".", ",")} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhuma rosca ou pão especial encontrado.</p>
      )}
    </ul>
  );
}
