"use client";

import { useEffect, useState } from "react";

interface Bolo {
  _id: string;
  nome: string;
  valor: string; // O valor será uma string devido ao Decimal128
}

export default function BolosDocesEspeciaisPage() {
  const [bolosDoces, setBolosDoces] = useState<Bolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchBolosDoces() {
      try {
        const response = await fetch("/api/bolos-doces-especiais");
        if (!response.ok) {
          throw new Error("Falha ao buscar os bolos e doces especiais");
        }
        const data = await response.json();
        setBolosDoces(data.bolosDocesEspeciais); // Ajuste aqui para corresponder à chave da API
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
            {bolo.nome} - R${parseFloat(bolo.valor).toFixed(2)} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum bolo ou doce especial encontrado.</p>
      )}
    </ul>
  );
}
