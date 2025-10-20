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

export default function SobremesasTortasPage() {
  const [sobremesasTortas, setSobremesasTortas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchSobremesasTortas() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar as sobremesas e tortas");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria doces
        setSobremesasTortas(data.doces || []);
      } catch (error) {
        console.error("Erro ao buscar sobremesas e tortas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSobremesasTortas();
  }, []);

  if (!isClient || loading) { // 🔹 Evita erro de SSR
    return <p>Carregando sobremesas e tortas...</p>;
  }

  return (
    <ul className="bg-blue-700">
      {sobremesasTortas.length > 0 ? (
        sobremesasTortas.map((sobremesa) => (
          <li key={sobremesa._id}>
            {sobremesa.nome} - R${sobremesa.preco.valor.toFixed(2).replace(".", ",")} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhuma sobremesa ou torta encontrada.</p>
      )}
    </ul>
  );
}
