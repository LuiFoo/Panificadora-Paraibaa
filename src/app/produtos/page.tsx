"use client";

import Header from "@/components/Header";
import MenuCategoria from "@/components/MenuCategoria";
import StarRating from "@/components/StarRating";
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Loading, { LoadingSkeleton } from "@/components/Loading";
import OptimizedImage from "@/components/OptimizedImage";
import { useDebounce } from "@/hooks/useDebounce";

interface ItemCardapio {
  _id: string;
  nome: string;
  valor: number;
  img: string;
  subc: string;
  vtipo: string;
  mediaAvaliacao?: number;
  totalAvaliacoes?: number;
}

const categoriasMenu: string[] = [
  "BOLOS DOCES ESPECIAIS",
  "DOCES INDIVIDUAIS",
  "PAES DOCES",
  "PAES SALGADOS ESPECIAIS",
  "ROSCAS PAES ESPECIAIS",
  "SALGADOS ASSADOS LANCHES",
  "SOBREMESAS TORTAS",
];

const categoriaPadrao = categoriasMenu[0];

export default function CardapioPage() {
  const [categoriaAtual, setCategoriaAtual] = useState<string>(categoriaPadrao);
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Debounce da busca
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Atualiza a categoria atual da URL ou define a padrão
  useEffect(() => {
    setIsClient(true);
    const params = new URLSearchParams(window.location.search);
    const categoriaParam = params.get("categoria");

    if (categoriaParam && categoriasMenu.includes(categoriaParam)) {
      setCategoriaAtual(categoriaParam);
    } else {
      setCategoriaAtual(categoriaPadrao);
      const url = new URL(window.location.href);
      url.searchParams.set("categoria", categoriaPadrao);
      window.history.replaceState({}, "", url);
    }

    buscarItensPorCategoria(categoriaPadrao); // Busca itens ao iniciar a página ou ao mudar a categoria
  }, []); // Deixe a lista de dependências vazia, porque você precisa buscar a categoria inicial

  const buscarItensPorCategoria = async (categoria: string) => {
    setLoading(true);

    try {
      const categoriaUrl = categoria.toLowerCase().replace(/\s+/g, "-");
      const response = await fetch(`/api/${categoriaUrl}`);

      if (!response.ok) {
        throw new Error(`Falha ao buscar itens da categoria ${categoria}`);
      }

      const data = await response.json();

      const chavesAPI: { [key: string]: string } = {
        "BOLOS DOCES ESPECIAIS": "bolosDocesEspeciais",
        "DOCES INDIVIDUAIS": "docesIndividuais",
        "PAES DOCES": "paesDoces",
        "PAES SALGADOS ESPECIAIS": "paesSalgadosEspeciais",
        "ROSCAS PAES ESPECIAIS": "roscasPaesEspeciais",
        "SALGADOS ASSADOS LANCHES": "salgadosAssadosLanches",
        "SOBREMESAS TORTAS": "sobremesasTortas",
      };

      const chave = chavesAPI[categoria] || Object.keys(data)[0];
      const itensData: ItemCardapio[] = data[chave] || [];
      
      // Buscar avaliações para cada produto
      const itensComAvaliacoes = await Promise.all(
        itensData.map(async (item) => {
          try {
            const avaliacoesRes = await fetch(`/api/avaliacoes?produtoId=${item._id}`);
            const avaliacoesData = await avaliacoesRes.json();
            
            return {
              ...item,
              mediaAvaliacao: avaliacoesData.media || 0,
              totalAvaliacoes: avaliacoesData.total || 0
            };
          } catch {
            return {
              ...item,
              mediaAvaliacao: 0,
              totalAvaliacoes: 0
            };
          }
        })
      );
      
      setItens(itensComAvaliacoes);
    } catch (error) {
      console.error(`Erro ao buscar itens da categoria ${categoria}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaClick = (categoria: string) => {
    setCategoriaAtual(categoria);
    buscarItensPorCategoria(categoria);

    const url = new URL(window.location.href);
    url.searchParams.set("categoria", categoria);
    window.history.pushState({}, "", url);
  };

  // Filtrar itens com base na busca
  const filteredItems = itens.filter((item) =>
    item.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.subc.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-6">Nosso Cardápio</h1>

        {/* Busca com debounce */}
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {debouncedSearch && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              {filteredItems.length} produto(s) encontrado(s)
            </p>
          )}
        </div>

        <MenuCategoria
          categories={categoriasMenu}
          activeCategory={categoriaAtual}
          variant="button"
          onCategoryClick={handleCategoriaClick}
        />

        <div className="mt-12">
          {categoriaAtual && (
            <h2 className="text-2xl font-bold mb-6 text-center">{categoriaAtual}</h2>
          )}

          {!isClient ? (
            <Loading size="lg" text="Carregando..." />
          ) : loading ? (
            <div className="flex flex-wrap justify-center gap-[30px]">
              <LoadingSkeleton count={6} />
            </div>
          ) : categoriaAtual ? (
            <div className="flex flex-wrap justify-center gap-[30px]">
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden w-75 p-5 hover:shadow-lg transition"
                  >
                    <OptimizedImage
                      src={item.img}
                      alt={item.nome}
                      width={250}
                      height={250}
                      className="object-cover rounded mb-4 justify-self-center"
                      quality={80}
                    />
                    <p className="font-bold text-[#646464]">{item.subc}</p>
                    <h3 className="text-lg font-semibold mb-2">{item.nome}</h3>
                    
                    {/* Avaliações */}
                    <div className="mb-3">
                      <StarRating 
                        rating={item.mediaAvaliacao || 0} 
                        total={item.totalAvaliacoes || 0}
                        size="sm"
                        showNumber={false}
                      />
                    </div>
                    
                    <p className="text-[var(--color-avocado-600)] font-bold mb-8">
                      R${item.valor.toFixed(2).replace(".", ",")} {item.vtipo}
                    </p>
                    <Link
                      href={`/produtos/${item._id}`}
                      className="inline-block font-semibold bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] text-white px-4 py-2 rounded-lg text-center"
                    >
                      Ver opções
                    </Link>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-8">
                  Nenhum item encontrado nesta categoria.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 px-4">
              Selecione uma categoria para ver os itens disponíveis.
            </p>
          )}
        </div>
      </div>

      <Footer showMap={false} />
    </>
  );
}
