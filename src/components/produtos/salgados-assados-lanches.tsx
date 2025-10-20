"use client";

import { useEffect, useState } from "react";

// interface Produto {
  _id: string;
  nome: string;
  slug: string;
  descricao: string;
  categoria: {
    nome: string;
    slug: string;
  };
  subcategoria: string;
  preco: {
    valor: number;
    tipo: string;
    promocao?: {
      ativo: boolean;
      valorPromocional: number;
    };
  };
  imagem: {
    href: string;
    alt: string;
  };
  avaliacao: {
    media: number;
    quantidade: number;
  };
  destaque: boolean;
  tags: string[];
  status: string;
// }

export default function SalgadosAssadosLanchesPage() {
  const [salgadosAssadosLanches, setSalgadosAssadosLanches] = useState<SalgadoAssadoLanche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchSalgadosAssadosLanches() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar os salgados assados e lanches");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria salgados
        setSalgadosAssadosLanches(data.salgados || []);
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
            {salgado.nome} - R${salgado.preco.valor.toFixed(2).replace(".", ",")} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum salgado assado ou lanche encontrado.</p>
      )}
    </ul>
  );
}
