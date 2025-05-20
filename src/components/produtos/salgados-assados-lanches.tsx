"use client";

import { useEffect, useState } from "react";

interface SalgadoAssadoLanche {
  _id: string;
  nome: string;
  valor: string; // O valor será uma string devido ao Decimal128
}

export default function SalgadosAssadosLanchesPage() {
  const [salgadosAssadosLanches, setSalgadosAssadosLanches] = useState<SalgadoAssadoLanche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchSalgadosAssadosLanches() {
      try {
        const response = await fetch("/api/salgados-assados-lanches");
        if (!response.ok) {
          throw new Error("Falha ao buscar os salgados assados e lanches");
        }
        const data = await response.json();
        setSalgadosAssadosLanches(data.salgadosAssadosLanches); // A chave deve ser a mesma que a API retorna
      } catch (error) {
        console.error("Erro ao buscar salgados assados e lanches:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalgadosAssadosLanches();
  }, []);

  if (!isClient || loading) { // 🔹 Evita erro de SSR
    return <p>Carregando salgados assados e lanches...</p>;
  }

  return (
    <ul className="bg-blue-700">
      {salgadosAssadosLanches.length > 0 ? (
        salgadosAssadosLanches.map((salgado) => (
          <li key={salgado._id}>
            {salgado.nome} - R${parseFloat(salgado.valor).toFixed(2)} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum salgado assado ou lanche encontrado.</p>
      )}
    </ul>
  );
}
