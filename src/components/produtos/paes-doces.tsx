"use client";

import { useEffect, useState } from "react";
import { Produto } from "@/types/Produto";

export default function PaesDocesPage() {
  const [paesDoces, setPaesDoces] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchPaesDoces() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar os pães e doces");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria doces
        setPaesDoces(data.doces || []);
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
            {paoDoce.nome} - R${paoDoce.preco.valor.toFixed(2).replace(".", ",")}
          </li>
        ))
      ) : (
        <p>Nenhum pão ou doce encontrado.</p>
      )}
    </ul>
  );
}
