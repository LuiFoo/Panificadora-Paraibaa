"use client";

import { useEffect, useState } from "react";

interface Doce {
  _id: string;
  nome: string;
  valor: string; // O valor será uma string devido ao Decimal128
}

export default function DocesIndividuaisPage() {
  const [docesIndividuais, setDocesIndividuais] = useState<Doce[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchDocesIndividuais() {
      try {
        const response = await fetch("/api/doces-individuais");
        if (!response.ok) {
          throw new Error("Falha ao buscar os doces individuais");
        }
        const data = await response.json();
        setDocesIndividuais(data.docesIndividuais); // A chave deve ser a mesma que a API retorna
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
            {doce.nome} - R${parseFloat(doce.valor).toFixed(2)} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum doce individual encontrado.</p>
      )}
    </ul>
  );
}
