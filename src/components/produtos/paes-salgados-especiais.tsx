"use client";

import { useEffect, useState } from "react";

interface Produto {
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
}

export default function PaesSalgadosEspeciaisPage() {
  const [paesSalgadosEspeciais, setPaesSalgadosEspeciais] = useState<PaoSalgadoEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 🔹 Estado para verificar se está no client

  useEffect(() => {
    setIsClient(true); // 🔹 Indica que está no client
    async function fetchPaesSalgadosEspeciais() {
      try {
        const response = await fetch("/api/produtos-unificados");
        if (!response.ok) {
          throw new Error("Falha ao buscar os pães salgados especiais");
        }
        const data = await response.json();
        // Filtrar apenas produtos da categoria paes
        setPaesSalgadosEspeciais(data.paes || []);
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
            {paoSalgado.nome} - R${paoSalgado.preco.valor.toFixed(2).replace(".", ",")} {/* Converte o valor para float e formata com 2 casas decimais */}
          </li>
        ))
      ) : (
        <p>Nenhum pão salgado especial encontrado.</p>
      )}
    </ul>
  );
}
