"use client";

import { useEffect, useState } from "react";

interface PaoSalgadoEspecial {
  _id: string;
  nome: string;
  valor: string; // O valor será uma string devido ao Decimal128
}

export default function PaesSalgadosEspeciaisPage() {
  const [paesSalgadosEspeciais, setPaesSalgadosEspeciais] = useState<PaoSalgadoEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchPaesSalgadosEspeciais() {
      try {
        const response = await fetch("/api/paes-salgados-especiais");
        if (!response.ok) {
          throw new Error("Falha ao buscar os pães salgados especiais");
        }
        const data = await response.json();
        setPaesSalgadosEspeciais(data.paesSalgadosEspeciais); // A chave deve ser a mesma que a API retorna
      } catch (error) {
        console.error("Erro ao buscar pães salgados especiais:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPaesSalgadosEspeciais();
  }, []);

  if (!isClient || loading) { // 🔹 Evita erro de SSR
    return <p>Carregando pães salgados especiais...</p>;
  }

  return (
    <ul className="bg-blue-700">
      {paesSalgadosEspeciais.length > 0 ? (
        paesSalgadosEspeciais.map((paoSalgado) => (
          <li key={paoSalgado._id}>
            {paoSalgado.nome} - R${parseFloat(paoSalgado.valor).toFixed(2)} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum pão salgado especial encontrado.</p>
      )}
    </ul>
  );
}
