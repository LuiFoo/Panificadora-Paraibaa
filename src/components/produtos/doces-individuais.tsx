"use client";

import { useEffect, useState } from "react";
import { Produto } from "@/types/Produto";

export default function DocesIndividuaisPage() {
  const [docesIndividuais, setDocesIndividuais] = useState<Produto[]>([]);
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
        docesIndividuais.map((doce) => {
          const doceData = doce as {
            _id: string;
            nome: string;
            preco: {
              valor: number;
              promocao?: {
                ativo: boolean;
                valorPromocional: number;
              };
            };
          };
          return (
            <li key={doceData._id}>
              {doceData.nome} - R${doceData.preco.valor.toFixed(2).replace(".", ",")}
              {doceData.preco.promocao?.ativo && (
                <span className="text-red-500 ml-2">
                  (Promoção: R${doceData.preco.promocao.valorPromocional.toFixed(2).replace(".", ",")})
                </span>
              )}
            </li>
          );
        })
      ) : (
        <p>Nenhum doce individual encontrado.</p>
      )}
    </ul>
  );
}
