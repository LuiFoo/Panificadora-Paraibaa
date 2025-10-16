"use client";

import Header from "@/components/Header";
import MenuCategoria from "@/components/MenuCategoria";
import StarRating from "@/components/StarRating";
import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Loading, { LoadingSkeleton } from "@/components/Loading";
import OptimizedImage from "@/components/OptimizedImage";

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
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Debounce simples da busca
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Observer para animações
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Cache de produtos por categoria
  const categoriaUrl = useMemo(() => 
    categoriaAtual.toLowerCase().replace(/\s+/g, "-"), 
    [categoriaAtual]
  );

  const [produtosCache, setProdutosCache] = useState<ItemCardapio[]>([]);
  const [cacheLoading, setCacheLoading] = useState(false);

  // Fetch de produtos
  useEffect(() => {
    const fetchProdutos = async () => {
      setCacheLoading(true);
      try {
        const response = await fetch(`/api/${categoriaUrl}`);
        if (!response.ok) throw new Error("Falha ao buscar produtos");
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
        
        const chave = chavesAPI[categoriaAtual] || Object.keys(data)[0];
        setProdutosCache(data[chave] || []);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        setProdutosCache([]);
      } finally {
        setCacheLoading(false);
      }
    };

    fetchProdutos();
  }, [categoriaUrl, categoriaAtual]);

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
  }, []); // Deixe a lista de dependências vazia, porque você precisa buscar a categoria inicial

  // Carregar produtos do cache quando mudar
  useEffect(() => {
    if (produtosCache) {
      buscarAvaliacoesEAtualizar(produtosCache);
    }
  }, [produtosCache]);

  const buscarAvaliacoesEAtualizar = async (itensData: ItemCardapio[]) => {
    setLoading(true);

    try {
      // Buscar todas as avaliações de uma vez (otimizado)
      const produtoIds = itensData.map(item => item._id).join(',');
      let avaliacoesMap: Record<string, { media: number; total: number }> = {};
      
      if (produtoIds) {
        try {
          const avaliacoesRes = await fetch(`/api/avaliacoes?produtoIds=${produtoIds}`);
          const avaliacoesData = await avaliacoesRes.json();
          
          if (avaliacoesData.avaliacoes) {
            avaliacoesMap = avaliacoesData.avaliacoes;
          }
        } catch (error) {
          console.error("Erro ao buscar avaliações:", error);
        }
      }
      
      // Adicionar avaliações aos itens
      const itensComAvaliacoes = itensData.map((item) => ({
        ...item,
        mediaAvaliacao: avaliacoesMap[item._id]?.media || 0,
        totalAvaliacoes: avaliacoesMap[item._id]?.total || 0
      }));
      
      setItens(itensComAvaliacoes);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      setItens(itensData);
    } finally {
      setLoading(false);
    }
  };

  const buscarItensPorCategoria = async (categoria: string) => {
    // Apenas atualiza a categoria - o cache cuida do resto
    setCategoriaAtual(categoria);
    
    const url = new URL(window.location.href);
    url.searchParams.set("categoria", categoria);
    window.history.pushState({}, "", url);
  };

  const handleCategoriaClick = (categoria: string) => {
    buscarItensPorCategoria(categoria);
  };

  // Filtrar itens com base na busca
  const filteredItems = itens.filter((item) =>
    item.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.subc.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className={`py-12 md:py-16 lg:py-20 px-4 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-3 md:mb-4">
              Explore Nossos Produtos
            </p>
            <h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-fonte-100)] mb-4 md:mb-6"
              style={{ fontFamily: "var(--fonte-secundaria)" }}
            >
              Nosso Cardápio Completo
            </h1>
            <p className="text-base md:text-lg text-[var(--color-alavaco-100)] mb-8 md:mb-12 max-w-2xl mx-auto">
              Descubra nossos produtos artesanais feitos com carinho e tradição
            </p>

            {/* Busca com debounce */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="w-full px-6 py-4 pl-14 pr-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:border-transparent shadow-lg hover:shadow-xl transition-all"
                />
                <svg
                  className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
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
                <p className="text-sm md:text-base text-[var(--color-alavaco-100)] mt-3 font-semibold">
                  {filteredItems.length} produto(s) encontrado(s)
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Menu de Categorias */}
        <section className="py-8 md:py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <MenuCategoria
              categories={categoriasMenu}
              activeCategory={categoriaAtual}
              variant="button"
              onCategoryClick={handleCategoriaClick}
            />
          </div>
        </section>

        {/* Grid de Produtos */}
        <section className="py-8 md:py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {categoriaAtual && (
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-fonte-100)]">
                  {categoriaAtual}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] mx-auto mt-4 rounded-full"></div>
              </div>
            )}

            {!isClient || cacheLoading ? (
              <Loading size="lg" text="Carregando..." />
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <LoadingSkeleton count={8} />
              </div>
            ) : categoriaAtual ? (
              filteredItems.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
                    >
                      <div className="relative overflow-hidden">
                        <OptimizedImage
                          src={item.img}
                          alt={item.nome}
                          width={300}
                          height={300}
                          className="object-cover w-full h-64 group-hover:scale-110 transition-transform duration-300"
                          quality={80}
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                          <span className="text-xs font-bold text-[var(--color-avocado-600)]">
                            {item.subc}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-lg font-bold mb-2 text-[var(--color-fonte-100)] line-clamp-2 min-h-[3.5rem]">
                          {item.nome}
                        </h3>
                        
                        {/* Avaliações */}
                        <div className="mb-3 flex items-center gap-2">
                          <StarRating 
                            rating={item.mediaAvaliacao || 0} 
                            total={item.totalAvaliacoes || 0}
                            size="sm"
                            showNumber={false}
                          />
                          {item.totalAvaliacoes && item.totalAvaliacoes > 0 && (
                            <span className="text-xs text-gray-500">
                              ({item.totalAvaliacoes})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-2xl font-bold text-[var(--color-avocado-600)]">
                            R${item.valor.toFixed(2).replace(".", ",")}
                          </p>
                          <span className="text-sm text-gray-500 font-medium">
                            {item.vtipo}
                          </span>
                        </div>
                        
                        <Link
                          href={`/produtos/${item._id}`}
                          className="block w-full text-center font-semibold bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] hover:from-[var(--color-avocado-700)] hover:to-[var(--color-avocado-600)] text-white px-4 py-3 rounded-xl transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          Ver Detalhes
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mb-6">
                    <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-500">
                    Tente buscar por outro termo ou categoria
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-gray-500">
                  Selecione uma categoria para ver os itens disponíveis.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer showMap={false} />
    </>
  );
}
