"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import Loading from "@/components/Loading";
import OptimizedImage from "@/components/OptimizedImage";

interface ItemCardapio {
  _id: string;
  nome: string;
  valor: number;
  img: string;
  subc: string;
  vtipo: string;
  ingredientes?: string;
  categoria?: string;
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

export default function ProdutoDetalhePage() {
  const params = useParams();
  const [produto, setProduto] = useState<ItemCardapio | null>(null);
  const [produtosRelacionados, setProdutosRelacionados] = useState<ItemCardapio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [mensagem, setMensagem] = useState<string>("");
  
  // Estados para avaliações
  const [mediaAvaliacao, setMediaAvaliacao] = useState<number>(0);
  const [totalAvaliacoes, setTotalAvaliacoes] = useState<number>(0);
  const [minhaAvaliacao, setMinhaAvaliacao] = useState<number | null>(null);
  const [avaliandoProduto, setAvaliandoProduto] = useState<boolean>(false);

  // Estados para animações
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  const { addItem } = useCart();
  const { user } = useUser();
  const { showToast } = useToast();

  // Observer para animações
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionsRef.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [produto]);

  const buscarAvaliacoes = async (produtoId: string) => {
    try {
      // Buscar média de avaliações
      const responseMedia = await fetch(`/api/avaliacoes?produtoId=${produtoId}`);
      const dataMedia = await responseMedia.json();
      
      if (dataMedia.success) {
        setMediaAvaliacao(dataMedia.media);
        setTotalAvaliacoes(dataMedia.total);
      }

      // Se usuário logado, buscar sua avaliação
      if (user?.login) {
        const responseMinhaAv = await fetch(`/api/minha-avaliacao?produtoId=${produtoId}&userId=${user.login}`);
        const dataMinhaAv = await responseMinhaAv.json();
        
        if (dataMinhaAv.success && dataMinhaAv.avaliacao) {
          setMinhaAvaliacao(dataMinhaAv.avaliacao.nota);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    }
  };

  const buscarProduto = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const chavesAPI: { [key: string]: string } = {
        "BOLOS DOCES ESPECIAIS": "bolosDocesEspeciais",
        "DOCES INDIVIDUAIS": "docesIndividuais",
        "PAES DOCES": "paesDoces",
        "PAES SALGADOS ESPECIAIS": "paesSalgadosEspeciais",
        "ROSCAS PAES ESPECIAIS": "roscasPaesEspeciais",
        "SALGADOS ASSADOS LANCHES": "salgadosAssadosLanches",
        "SOBREMESAS TORTAS": "sobremesasTortas",
      };

      for (const categoria of categoriasMenu) {
        const categoriaUrl = categoria.toLowerCase().replace(/\s+/g, "-");
        const response = await fetch(`/api/${categoriaUrl}`);

        if (response.ok) {
          const data = await response.json();
          const chave = chavesAPI[categoria] || Object.keys(data)[0];
          const itens: ItemCardapio[] = data[chave] || [];

          const produtoEncontrado = itens.find((item) => item._id === id);
          if (produtoEncontrado) {
            setProduto(produtoEncontrado);
            const relacionados = itens.filter((item) => item._id !== id).slice(0, 4);
            setProdutosRelacionados(relacionados);
            
            // Buscar avaliações do produto
            buscarAvaliacoes(id);
            
            setLoading(false);
            return;
          }
        }
      }

      setError("Produto não encontrado");
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      setError("Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função de busca do produto
  useEffect(() => {
    if (params?.id) {
      buscarProduto(params.id as string);
    }
  }, [params?.id, buscarProduto]);

  const enviarAvaliacao = async (nota: number) => {
    if (!user?.login) {
      showToast("Faça login para avaliar este produto", "warning");
      return;
    }

    if (!produto) return;

    setAvaliandoProduto(true);

    try {
      const response = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: produto._id,
          userId: user.login,
          nota
        })
      });

      const data = await response.json();

      if (data.success) {
        setMinhaAvaliacao(nota);
        showToast("Avaliação enviada com sucesso!", "success");
        // Atualizar média
        buscarAvaliacoes(produto._id);
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      showToast("Erro ao enviar avaliação", "error");
    } finally {
      setAvaliandoProduto(false);
    }
  };

  const handleAddToCart = async () => {
    if (!produto) {
      setMensagem("Produto não encontrado.");
      setTimeout(() => setMensagem(""), 3000);
      return;
    }

    if (!user || !user.login) {
      setMensagem("Você precisa estar logado para adicionar ao carrinho.");
      setTimeout(() => setMensagem(""), 3000);
      return;
    }

    if (quantidade < 1) {
      setMensagem("A quantidade deve ser pelo menos 1.");
      setTimeout(() => setMensagem(""), 3000);
      return;
    }

    const resultado = await addItem({
      id: produto._id,
      nome: produto.nome,
      valor: produto.valor,
      quantidade,
      img: produto.img,
    });

    // Mostrar mensagem de sucesso ou erro retornada
    setMensagem(resultado.message);
    
    // Desaparece após 3 segundos
    setTimeout(() => setMensagem(""), 3000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto py-8">
          <Loading size="lg" text="Carregando produto..." />
        </div>
      </>
    );
  }

  if (error || !produto) {
    return (
      <>
        <Header />
        <div className="mx-auto py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 mb-6">{error || "O produto que você está procurando não existe."}</p>
          <Link
            href="/produtos"
            className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-gradient-to-b from-white to-gray-50">
        {/* Breadcrumb */}
        <section className="py-4 md:py-6 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <Link href="/produtos" className="inline-flex items-center text-[var(--color-avocado-600)] hover:text-[var(--color-avocado-700)] font-semibold transition-colors group">
              <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Cardápio
            </Link>
          </div>
        </section>

        {/* Detalhes do Produto */}
        <section className="py-8 md:py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {/* Imagem do Produto */}
              <div 
                id="imagem"
                ref={(el) => { sectionsRef.current['imagem'] = el; }}
                className={`transition-all duration-1000 ${
                  isVisible['imagem'] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <OptimizedImage 
              src={produto.img} 
              alt={produto.nome} 
              width={600} 
              height={600} 
                      className="w-full h-auto object-cover"
              quality={90}
            />
                  </div>
                </div>
          </div>

              {/* Informações do Produto */}
              <div 
                id="info"
                ref={(el) => { sectionsRef.current['info'] = el; }}
                className={`transition-all duration-1000 delay-200 ${
                  isVisible['info'] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                }`}
              >
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 h-full">
                  {/* Badges */}
            <div className="mb-4 flex gap-2 flex-wrap">
                    <span className="inline-block bg-gradient-to-r from-[var(--color-avocado-100)] to-[var(--color-avocado-200)] text-[var(--color-avocado-800)] text-xs md:text-sm font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-md">
                {produto.subc}
              </span>
              {produto.categoria && (
                      <span className="inline-block bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs md:text-sm font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-md">
                  {produto.categoria}
                </span>
              )}
            </div>

                  {/* Título */}
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-fonte-100)] mb-4" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                    {produto.nome}
                  </h1>

                  {/* Preço */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-[var(--color-avocado-50)] to-green-50 rounded-2xl">
                    <p className="text-3xl md:text-4xl font-bold text-[var(--color-avocado-600)]">
                      R$ {produto.valor.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-sm md:text-base text-gray-600 font-medium mt-1">
                      {produto.vtipo}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Avaliações */}
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2 text-amber-800">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Avaliação dos Clientes
                </h3>
                
                {/* Média de avaliações */}
                <div className="mb-4">
                  <StarRating 
                    rating={mediaAvaliacao} 
                    total={totalAvaliacoes}
                    size="lg"
                    showNumber={true}
                  />
                </div>

                {/* Avaliar produto */}
                {user?.login && (
                        <div className="bg-white rounded-xl p-4 border-2 border-amber-300">
                          <p className="text-sm md:text-base font-semibold mb-2 text-gray-700">
                      {minhaAvaliacao ? "Sua avaliação:" : "Avalie este produto:"}
                    </p>
                    <StarRating 
                      rating={minhaAvaliacao || 0}
                      size="md"
                      showNumber={false}
                      interactive={true}
                      onRate={enviarAvaliacao}
                    />
                    {avaliandoProduto && (
                      <p className="text-xs text-gray-500 mt-2">Enviando avaliação...</p>
                    )}
                    {minhaAvaliacao && (
                            <p className="text-xs text-green-600 mt-2 font-semibold">✓ Você avaliou com {minhaAvaliacao} estrela{minhaAvaliacao > 1 ? 's' : ''}</p>
                    )}
                  </div>
                )}

                {!user?.login && (
                        <div className="bg-white rounded-xl p-4 border-2 border-gray-300">
                          <p className="text-sm md:text-base text-gray-600">
                            <Link href="/login" className="text-[var(--color-avocado-600)] hover:underline font-semibold">
                        Faça login
                      </Link>
                      {' '}para avaliar este produto
                    </p>
                  </div>
                )}
              </div>

                    {/* Ingredientes */}
                    {produto.ingredientes && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2 text-blue-800">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Ingredientes
                        </h3>
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                            {produto.ingredientes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quantidade e Botões */}
                    <div className="space-y-4">
              {/* Input de quantidade */}
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <label className="font-bold text-gray-700 flex items-center gap-2 mb-3 text-sm md:text-base">
                          <svg className="w-5 h-5 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Quantidade:
                </label>
                        <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                            className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 hover:border-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-50)] flex items-center justify-center font-bold text-lg transition-all transform hover:scale-110"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                            className="w-20 border-2 border-gray-300 rounded-xl px-3 py-2 text-center font-bold text-lg focus:border-[var(--color-avocado-600)] focus:outline-none"
                    aria-label="Quantidade"
                  />
                  <button
                    onClick={() => setQuantidade(Math.min(20, quantidade + 1))}
                            className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 hover:border-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-50)] flex items-center justify-center font-bold text-lg transition-all transform hover:scale-110"
                  >
                    +
                  </button>
                </div>
              </div>

                      {/* Botões */}
                      <div className="flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                          className="w-full bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] hover:from-[var(--color-avocado-700)] hover:to-[var(--color-avocado-600)] text-white text-center px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-base md:text-lg"
                >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Adicionar ao Carrinho
                </button>

                <Link
                  href="/produtos"
                          className="w-full border-2 border-[var(--color-avocado-600)] text-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-50)] text-center px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-base md:text-lg"
                >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Ver Mais Produtos
                </Link>
              </div>

              {/* Mensagem de feedback */}
              {mensagem && (
                        <div className={`p-4 rounded-xl font-semibold text-center ${
                  mensagem.includes("sucesso") || mensagem.includes("adicionado") 
                            ? "bg-green-50 text-green-700 border-2 border-green-200" 
                    : mensagem.includes("Limite") || mensagem.includes("máximo") || mensagem.includes("Erro")
                            ? "bg-red-50 text-red-700 border-2 border-red-200"
                            : "bg-amber-50 text-amber-700 border-2 border-amber-200"
                }`}>
                  {mensagem}
                        </div>
              )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Produtos Relacionados */}
        {produtosRelacionados.length > 0 && (
          <section 
            id="relacionados"
            ref={(el) => { sectionsRef.current['relacionados'] = el; }}
            className={`py-12 md:py-16 lg:py-20 px-4 transition-all duration-1000 delay-400 ${
              isVisible['relacionados'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8 md:mb-12">
                <p className="text-[var(--color-alavaco-100)] uppercase font-bold text-xs md:text-sm tracking-wider mb-2 md:mb-4">
                  Mais Produtos
                </p>
                <h2 
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-fonte-100)]"
                  style={{ fontFamily: "var(--fonte-secundaria)" }}
                >
                  Produtos Relacionados
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] mx-auto mt-4 rounded-full"></div>
          </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {produtosRelacionados.map((item) => (
                  <Link
                    key={item._id}
                    href={`/produtos/${item._id}`}
                    className="group"
                  >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
                      <div className="relative overflow-hidden">
                    <OptimizedImage 
                      src={item.img} 
                      alt={item.nome} 
                          width={300} 
                          height={300} 
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300" 
                      quality={80}
                    />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                          <span className="text-xs font-bold text-[var(--color-avocado-600)]">
                            {item.subc}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                          {item.nome}
                        </h3>
                        <div className="mt-auto">
                          <p className="text-2xl font-bold text-[var(--color-avocado-600)] mb-3">
                      R$ {item.valor.toFixed(2).replace(".", ",")}
                    </p>
                          <div className="w-full bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] hover:from-[var(--color-avocado-700)] hover:to-[var(--color-avocado-600)] text-white text-center px-4 py-3 rounded-xl font-bold transition-all transform group-hover:scale-105 shadow-md hover:shadow-lg">
                      Ver Detalhes
                          </div>
                        </div>
                      </div>
                    </div>
                    </Link>
                ))}
              </div>
            </div>
          </section>
          )}
      </main>

      <Footer />
    </>
  );
}
