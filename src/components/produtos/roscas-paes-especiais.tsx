"use client";

import { useEffect, useState } from "react";

interface RoscaPaoEspecial {
  _id: string;
  nome: string;
  valor: string; // O valor será uma string devido ao Decimal128
}

export default function RoscasPaesEspeciaisPage() {
  const [roscasPaesEspeciais, setRoscasPaesEspeciais] = useState<RoscaPaoEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchRoscasPaesEspeciais() {
      try {
        const response = await fetch("/api/roscas-paes-especiais");
        if (!response.ok) {
          throw new Error("Falha ao buscar as roscas e pães especiais");
        }
        const data = await response.json();
        setRoscasPaesEspeciais(data.roscasPaesEspeciais); // A chave deve ser a mesma que a API retorna
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
            {roscaPao.nome} - R${parseFloat(roscaPao.valor).toFixed(2)} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhuma rosca ou pão especial encontrado.</p>
      )}
    </ul>
  );
}
