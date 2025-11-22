"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import StarRating from "@/components/StarRating";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { safeParseInt, clamp } from "@/lib/validation";
import { useUser } from "@/context/UserContext";
import Loading from "@/components/Loading";
import OptimizedImage from "@/components/OptimizedImage";
import type { Produto } from "@/types/Produto";

export default function ProdutoDetalhePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fromPanel = searchParams?.get('from') === 'panel';
  const [produto, setProduto] = useState<Produto | null>(null);
  const [produtosRelacionados, setProdutosRelacionados] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [mensagem, setMensagem] = useState<string>("");
  
  // Estados para avaliações
  const [mediaAvaliacao, setMediaAvaliacao] = useState<number>(0);
  const [totalAvaliacoes, setTotalAvaliacoes] = useState<number>(0);
  const [minhaAvaliacao, setMinhaAvaliacao] = useState<number | null>(null);
  const [avaliandoProduto, setAvaliandoProduto] = useState<boolean>(false);

  const { addItem } = useCart();
  const { user } = useUser();

  const buscarAvaliacoes = useCallback(async (produtoId: string) => {
    try {
      const responseMedia = await fetch(`/api/avaliacoes?produtoId=${produtoId}`);
      
      // 🐛 CORREÇÃO: Verificar se resposta é OK e JSON válido antes de fazer parse
      if (responseMedia.ok) {
        const contentType = responseMedia.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const dataMedia = await responseMedia.json();
          
          if (dataMedia.success) {
            setMediaAvaliacao(dataMedia.media);
            setTotalAvaliacoes(dataMedia.total);
          }
        }
      }

      if (user?.login) {
        const responseMinhaAv = await fetch(`/api/minha-avaliacao?produtoId=${produtoId}&userId=${user.login}`);
        
        // 🐛 CORREÇÃO: Verificar se resposta é OK e JSON válido antes de fazer parse
        if (responseMinhaAv.ok) {
          const contentType = responseMinhaAv.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const dataMinhaAv = await responseMinhaAv.json();
            
            if (dataMinhaAv.success && dataMinhaAv.avaliacao) {
              setMinhaAvaliacao(dataMinhaAv.avaliacao.nota);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    }
  }, [user?.login]);

  const buscarProduto = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/produtos/slug/${id}`);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Resposta não é JSON:", text.substring(0, 200));
        setError("Erro ao carregar produto: resposta inválida do servidor");
        setLoading(false);
        return;
      }
      
      if (response.ok) {
        const produtoEncontrado = await response.json();
        
        // Normalizar arrays - sempre garantir que sejam arrays (mesmo vazios)
        produtoEncontrado.ingredientes = Array.isArray(produtoEncontrado.ingredientes) 
          ? produtoEncontrado.ingredientes 
          : (typeof produtoEncontrado.ingredientes === 'string' && produtoEncontrado.ingredientes.trim()
            ? produtoEncontrado.ingredientes.split(',').map((i: string) => i.trim()).filter(Boolean)
            : []);
        
        // Campos removidos: alergicos e tags não são mais processados
        
        setProduto(produtoEncontrado);
        
        // Buscar produtos relacionados
        if (produtoEncontrado.categoria?.slug) {
          const categoriaResponse = await fetch(`/api/produtos/categoria/${produtoEncontrado.categoria.slug}`);
          if (categoriaResponse.ok) {
            const data = await categoriaResponse.json();
            const relacionados = data.produtos.filter((item: Produto) => item._id !== produtoEncontrado._id).slice(0, 4);
            setProdutosRelacionados(relacionados);
          }
        }
        
        if (produtoEncontrado.avaliacao) {
          setMediaAvaliacao(produtoEncontrado.avaliacao.media || 0);
          setTotalAvaliacoes(produtoEncontrado.avaliacao.quantidade || 0);
        }
        
        buscarAvaliacoes(produtoEncontrado._id);
        setLoading(false);
        return;
      }

      try {
        const errorData = await response.json();
        if (response.status === 404) {
          setError("Produto não encontrado");
        } else if (response.status === 400) {
          setError(errorData.error || "ID do produto inválido");
        } else {
          setError(errorData.error || "Erro ao carregar produto");
        }
      } catch {
        if (response.status === 404) {
          setError("Produto não encontrado");
        } else {
          setError(`Erro ao carregar produto (status: ${response.status})`);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  }, [buscarAvaliacoes]);

  useEffect(() => {
    if (params?.id) {
      buscarProduto(params.id as string);
    }
  }, [params?.id, buscarProduto]);

  const enviarAvaliacao = async (nota: number) => {
    if (!user?.login || !produto) return;

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

      // 🐛 CORREÇÃO: Verificar se resposta é JSON válido antes de fazer parse
      let data;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          throw new Error("Resposta não é JSON");
        }
      } catch (jsonError) {
        console.error("Erro ao parsear JSON:", jsonError);
        return;
      }
      
      if (data.success) {
        setMinhaAvaliacao(nota);
        buscarAvaliacoes(produto._id);
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
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
      valor: produto.preco?.promocao?.ativo ? (produto.preco.promocao?.valorPromocional || produto.preco?.valor || 0) : produto.preco?.valor || 0,
      quantidade,
      img: produto.imagem?.href || '/images/placeholder.png',
    });

    setMensagem(resultado.message);
    setTimeout(() => setMensagem(""), 3000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Breadcrumb durante carregamento */}
            <BreadcrumbNav 
              items={fromPanel ? [
                { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
                { label: "Produtos", href: "/painel/produtos", icon: "🛍️", color: "orange" },
                { label: "Carregando...", icon: "🍞", color: "gray" }
              ] : [
                { label: "Início", href: "/", icon: "🏠", color: "blue" },
                { label: "Produtos", href: "/produtos", icon: "🛍️", color: "orange" },
                { label: "Carregando...", icon: "🍞", color: "gray" }
              ]}
            />
            <div className="min-h-screen flex items-center justify-center">
              <Loading size="lg" text="Carregando produto..." />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Breadcrumb mesmo em caso de erro */}
            <BreadcrumbNav 
              items={fromPanel ? [
                { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
                { label: "Produtos", href: "/painel/produtos", icon: "🛍️", color: "orange" },
                { label: "Produto não encontrado", icon: "🍞", color: "red" }
              ] : [
                { label: "Início", href: "/", icon: "🏠", color: "blue" },
                { label: "Produtos", href: "/produtos", icon: "🛍️", color: "orange" },
                { label: "Produto não encontrado", icon: "🍞", color: "red" }
              ]}
            />
            <div className="min-h-screen flex items-center justify-center px-4">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <svg className="w-24 h-24 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold mb-4 text-gray-800">Produto não encontrado</h1>
                <p className="text-gray-600 mb-8">{error || "O produto que você está procurando não existe."}</p>
                <Link
                  href={fromPanel ? "/painel/produtos" : "/produtos"}
                  className="inline-block bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-700)] text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
                >
                  {fromPanel ? "Voltar ao Painel" : "Voltar ao Cardápio"}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!produto) {
    return (
      <>
        <Header />
        <main className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Breadcrumb durante carregamento */}
            <BreadcrumbNav 
              items={fromPanel ? [
                { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
                { label: "Produtos", href: "/painel/produtos", icon: "🛍️", color: "orange" },
                { label: "Carregando...", icon: "🍞", color: "gray" }
              ] : [
                { label: "Início", href: "/", icon: "🏠", color: "blue" },
                { label: "Produtos", href: "/produtos", icon: "🛍️", color: "orange" },
                { label: "Carregando...", icon: "🍞", color: "gray" }
              ]}
            />
            <div className="min-h-screen flex items-center justify-center px-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-avocado-600)] mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando produto...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Galeria removida - usando apenas imagem principal
  const imagemPrincipal = produto.imagem?.href || '/images/placeholder.png';

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen">
        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          {/* Breadcrumb */}
          <BreadcrumbNav 
            items={fromPanel ? [
              { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
              { label: "Produtos", href: "/painel/produtos", icon: "🛍️", color: "orange" },
              { label: produto?.nome || "Carregando...", icon: "🍞", color: "green" }
            ] : [
              { label: "Início", href: "/", icon: "🏠", color: "blue" },
              { label: "Produtos", href: "/produtos", icon: "🛍️", color: "orange" },
              { label: produto?.nome || "Carregando...", icon: "🍞", color: "green" }
            ]}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Coluna Esquerda - Imagens */}
            <div className="space-y-6">
              {/* Imagem Principal */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden aspect-square">
                <OptimizedImage 
                  src={imagemPrincipal} 
                  alt={produto.imagem?.alt || produto.nome || 'Produto'} 
                  width={800} 
                  height={800} 
                  className="w-full h-full object-cover"
                  quality={95}
                />
              </div>

              {/* Ingredientes */}
              {produto.ingredientes && Array.isArray(produto.ingredientes) && produto.ingredientes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Ingredientes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {produto.ingredientes.map((ingrediente: string, index: number) => (
                      <span key={index} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        {ingrediente}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita - Informações */}
            <div className="space-y-6">
              {/* Header do Produto */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {produto.destaque && (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      DESTAQUE
                    </span>
                  )}
                  {produto.categoria && produto.categoria.nome && (
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                      {produto.categoria.nome}
                    </span>
                  )}
                </div>

                {/* Título */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                  {produto.nome}
                </h1>

                {/* Avaliação */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <StarRating 
                    rating={mediaAvaliacao} 
                    total={totalAvaliacoes}
                    size="md"
                    showNumber={true}
                  />
                  {totalAvaliacoes > 0 && (
                    <span className="text-sm text-gray-600">
                      ({totalAvaliacoes} avaliação{totalAvaliacoes > 1 ? 'ões' : ''})
                    </span>
                  )}
                </div>

                {/* Preço */}
                <div className="mb-6">
                  {produto.preco?.promocao?.ativo ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm text-gray-500">Preço Promocional</span>
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">PROMOÇÃO</span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <p className="text-4xl md:text-5xl font-bold text-[var(--color-avocado-600)]">
                          R$ {(produto.preco.promocao?.valorPromocional || 0).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <p className="text-xl text-gray-400 line-through">
                        R$ {(produto.preco?.valor || 0).toFixed(2).replace(".", ",")}
                      </p>
                      {produto.preco?.promocao?.inicio && produto.preco?.promocao?.fim && (() => {
                        // 🐛 CORREÇÃO: Validar datas antes de formatar
                        const inicio = new Date(produto.preco.promocao.inicio);
                        const fim = new Date(produto.preco.promocao.fim);
                        if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
                          return (
                            <p className="text-sm text-gray-600 mt-2">
                              Válido de {inicio.toLocaleDateString('pt-BR')} até {fim.toLocaleDateString('pt-BR')}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Preço</span>
                      <p className="text-4xl md:text-5xl font-bold text-[var(--color-avocado-600)]">
                        R$ {(produto.preco?.valor || 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    Unidade: <span className="font-semibold">{produto.preco?.tipo || 'UN'}</span>
                  </p>
                </div>

                {/* Descrição */}
                {produto.descricao && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Descrição</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {produto.descricao}
                    </p>
                  </div>
                )}

                {/* Informações de Estoque */}
                {produto.estoque?.quantidade !== undefined && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>
                        {produto.estoque.quantidade > 0 
                          ? `${produto.estoque.quantidade} unidade${produto.estoque.quantidade > 1 ? 's' : ''} disponível${produto.estoque.quantidade > 1 ? 'eis' : ''}`
                          : 'Produto esgotado'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Quantidade e Botão */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Quantidade</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                        className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Diminuir quantidade"
                        disabled={quantidade <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={produto.estoque?.quantidade || 20}
                        value={quantidade}
                        onChange={(e) => setQuantidade(clamp(safeParseInt(e.target.value, 1), 1, produto.estoque?.quantidade || 20))}
                        className="w-20 border-2 border-gray-300 rounded-lg px-4 py-3 text-center font-bold text-xl focus:border-[var(--color-avocado-600)] focus:outline-none"
                        aria-label="Quantidade"
                      />
                      <button
                        onClick={() => setQuantidade(Math.min(produto.estoque?.quantidade || 20, quantidade + 1))}
                        className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Aumentar quantidade"
                        disabled={produto.estoque?.quantidade !== undefined && quantidade >= produto.estoque.quantidade}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={produto.estoque?.disponivel === false}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                      produto.estoque?.disponivel === false
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-700)] text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {produto.estoque?.disponivel === false ? 'Produto Indisponível' : 'Adicionar ao Carrinho'}
                  </button>

                  {mensagem && (
                    <div className={`p-4 rounded-xl text-center font-semibold ${
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

              {/* Avaliações */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Avaliações
                </h3>
                
                {user?.login ? (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold mb-3 text-gray-700">
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
                      <p className="text-xs text-green-600 mt-2 font-semibold">
                        ✓ Você avaliou com {minhaAvaliacao} estrela{minhaAvaliacao > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                    <p className="text-sm text-gray-600">
                      <Link href="/login" className="text-[var(--color-avocado-600)] hover:underline font-semibold">
                        Faça login
                      </Link>
                      {' '}para avaliar este produto
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Produtos Relacionados */}
        {produtosRelacionados.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--fonte-secundaria)" }}>
                Produtos Relacionados
              </h2>
              <div className="w-20 h-1 bg-[var(--color-avocado-600)] rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtosRelacionados.map((item) => (
                <Link
                  key={item._id}
                  href={`/produtos/${item._id}`}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <OptimizedImage 
                      src={item.imagem?.href || '/images/placeholder.png'} 
                      alt={item.nome || 'Produto'} 
                      width={400} 
                      height={400} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      quality={80}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">
                      {item.nome}
                    </h3>
                    <p className="text-2xl font-bold text-[var(--color-avocado-600)] mb-3">
                      R$ {(item.preco?.valor || 0).toFixed(2).replace(".", ",")}
                    </p>
                    <div className="w-full bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-700)] text-white text-center px-4 py-2 rounded-lg font-semibold transition-colors">
                      Ver Detalhes
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
