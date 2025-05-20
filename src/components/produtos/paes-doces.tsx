"use client";

import { useEffect, useState } from "react";

interface PaoDoce {
  _id: string;
  nome: string;
  valor: string; // O valor será uma string devido ao Decimal128
}

export default function PaesDocesPage() {
  const [paesDoces, setPaesDoces] = useState<PaoDoce[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchPaesDoces() {
      try {
        const response = await fetch("/api/paes-doces");
        if (!response.ok) {
          throw new Error("Falha ao buscar os pães e doces");
        }
        const data = await response.json();
        setPaesDoces(data.paesDoces); // A chave deve ser a mesma que a API retorna
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
            {paoDoce.nome} - R${parseFloat(paoDoce.valor).toFixed(2)} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum pão ou doce encontrado.</p>
      )}
    </ul>
  );
}
