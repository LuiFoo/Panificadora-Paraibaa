"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";

interface ItemCardapio {
  _id: string;
  nome: string;
  valor: number;
  img: string;
  subc: string;
  vtipo: string;
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

  const { addItem } = useCart();
  const { user } = useUser();
  const { showToast } = useToast();

  // Função de busca do produto
  useEffect(() => {
    if (params?.id) {
      buscarProduto(params.id as string);
    }
  }, [params?.id]);

  const buscarProduto = async (id: string) => {
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
  };

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

  const handleAddToCart = () => {
    if (!produto) {
      setMensagem("Produto não encontrado.");
      return;
    }

    if (!user || !user.login) {
      setMensagem("Você precisa estar logado para adicionar ao carrinho.");
      return;
    }

    if (quantidade < 1) {
      setMensagem("A quantidade deve ser pelo menos 1.");
      return;
    }

    addItem({
      id: produto._id,
      nome: produto.nome,
      valor: produto.valor,
      quantidade,
      img: produto.img,
    });

    // Mostra a mensagem no front
    setMensagem(`${quantidade}x ${produto.nome} adicionado ao carrinho!`);

    // Desaparece após 3 segundos
    setTimeout(() => setMensagem(""), 3000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" aria-label="Carregando..."></div>
          </div>
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
      <div className="mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6">
          <Link href="/produtos" className="inline-flex items-center text-amber-600 hover:text-amber-500 font-semibold">
            ← Voltar ao Cardápio
          </Link>
        </div>

        <section className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Image src={produto.img} alt={produto.nome} width={600} height={600} className="w-full h-auto rounded-lg shadow-lg object-cover" />
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-lg p-8">
            <div className="mb-4">
              <span className="inline-block bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full">
                {produto.subc}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-4">{produto.nome}</h1>
            <div className="mb-6">
              <p className="text-2xl font-bold text-[var(--color-avocado-600)]">
                R${produto.valor.toFixed(2).replace(".", ",")} {produto.vtipo}
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Informações do Produto</h3>
                <p className="text-gray-600 leading-relaxed">
                  Este é um produto da categoria <strong>{produto.subc}</strong>. Entre em contato conosco para mais informações sobre disponibilidade, tamanhos e opções de personalização.
                </p>
              </div>

              {/* Avaliações do produto */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Avaliação dos Clientes</h3>
                
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
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-2">
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
                      <p className="text-xs text-green-600 mt-2">✓ Você avaliou com {minhaAvaliacao} estrela{minhaAvaliacao > 1 ? 's' : ''}</p>
                    )}
                  </div>
                )}

                {!user?.login && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <Link href="/login" className="text-amber-600 hover:underline font-semibold">
                        Faça login
                      </Link>
                      {' '}para avaliar este produto
                    </p>
                  </div>
                )}
              </div>

              {/* Input de quantidade */}
              <div className="flex items-center gap-4">
                <label className="font-semibold">Quantidade:</label>
                <input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value))}
                  className="w-20 border border-gray-300 rounded px-2 py-1"
                  aria-label="Quantidade"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Adicionar ao Carrinho
                </button>

                <Link
                  href="/produtos"
                  className="flex-1 border border-[var(--color-avocado-600)] text-[var(--color-avocado-600)] hover:bg-amber-50 text-center px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Ver Mais Produtos
                </Link>
              </div>

              {/* Mensagem de feedback */}
              {mensagem && (
                <p className="mt-2 text-[var(--color-avocado-600)] font-semibold">{mensagem}</p>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 md:px-20 py-10 mt-10 shadow-lg">
          <div className="mb-6">
            <h5 className="inline-block px-5 py-2 text-md font-bold text-gray-800 border-2 border-gray-300 rounded-md bg-white shadow-sm">
              Descrição
            </h5>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">
            Este é um produto da categoria <strong>{produto.subc}</strong>. Entre em contato conosco para mais informações sobre disponibilidade, tamanhos e opções de personalização.
          </p>

          {produtosRelacionados.length > 0 && (
            <div>
              <div className="border-t w-60 max-w-4xl mx-auto"></div>
              <p className="mt-4 text-center text-xl font-semibold">Produtos Relacionados</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {produtosRelacionados.map((item) => (
                  <div key={item._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex flex-col">
                    <Image src={item.img} alt={item.nome} width={200} height={200} className="w-full h-40 object-cover rounded" />
                    <h3 className="mt-2 text-center font-medium">{item.nome}</h3>
                    <Link
                      href={`/produtos/${item._id}`}
                      className="mt-4 bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] text-white text-center px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Ver Opção
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}
