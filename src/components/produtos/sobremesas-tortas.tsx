"use client";

import { useEffect, useState } from "react";

interface SobremesaTorta {
  _id: string;
  nome: string;
  valor: string; // O valor será uma string devido ao Decimal128
}

export default function SobremesasTortasPage() {
  const [sobremesasTortas, setSobremesasTortas] = useState<SobremesaTorta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchSobremesasTortas() {
      try {
        const response = await fetch("/api/sobremesas-tortas");
        if (!response.ok) {
          throw new Error("Falha ao buscar as sobremesas e tortas");
        }
        const data = await response.json();
        setSobremesasTortas(data.sobremesasTortas); // A chave deve ser a mesma que a API retorna
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
            {sobremesa.nome} - R${parseFloat(sobremesa.valor).toFixed(2)} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhuma sobremesa ou torta encontrada.</p>
      )}
    </ul>
  );
}
