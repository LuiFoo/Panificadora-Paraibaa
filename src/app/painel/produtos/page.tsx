"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Produto {
  _id: string;
  subc?: string; // subcategoria (para produtos novos)
  subcategoria?: string; // subcategoria (para produtos existentes)
  nome: string;
  valor: number;
  vtipo: string; // tipo de venda (UN, KG, etc)
  ingredientes: string;
  img: string;
  colecaoOrigem: string; // coleção de origem do produto
  dataCriacao?: string | Date;
  dataAtualizacao?: string | Date;
}

const TIPOS_VENDA = ["UN", "KG", "PCT", "DZ"];

// Subcategorias válidas como fallback
const SUBCATEGORIAS_PADRAO = [
  "BOLOS DOCES ESPECIAIS",
  "DOCES INDIVIDUAIS",
  "PAES DOCES",
  "PAES SALGADOS ESPECIAIS",
  "ROSCAS PAES ESPECIAIS",
  "SALGADOS ASSADOS LANCHES",
  "SOBREMESAS TORTAS"
];

export default function ProdutosPage() {
  const { user, isAdmin, loading } = useUser();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [subcategorias, setSubcategorias] = useState<string[]>(SUBCATEGORIAS_PADRAO);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [criandoExemplo, setCriandoExemplo] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    subc: "",
    nome: "",
    valor: "",
    vtipo: "",
    ingredientes: "",
    img: ""
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchProdutos();
    } else if (!loading) {
      setLoadingProdutos(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, loading]);

  const fetchProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const response = await fetch("/api/admin/produtos/todos");
      if (response.ok) {
        const data = await response.json();
        setProdutos(data.produtos || []);
        // Se a API retornar subcategorias, usa elas; senão, mantém as padrão
        if (data.subcategorias && data.subcategorias.length > 0) {
          setSubcategorias(data.subcategorias);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoadingProdutos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 Formulário submetido com dados:", formData);
    
    try {
      let response;
      let data;

      if (produtoEditando) {
        console.log("📝 Modo: EDITAR produto");
        // Editar produto existente
        response = await fetch("/api/admin/produtos/editar-existente", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: produtoEditando._id,
            colecaoOrigem: produtoEditando.colecaoOrigem,
            nome: formData.nome,
            valor: parseFloat(formData.valor),
            vtipo: formData.vtipo,
            ingredientes: formData.ingredientes,
            img: formData.img
          })
        });
        data = await response.json();
      } else {
        console.log("➕ Modo: CRIAR novo produto");
        // Criar novo produto
        response = await fetch("/api/admin/produtos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            subc: formData.subc,
            nome: formData.nome,
            valor: parseFloat(formData.valor),
            vtipo: formData.vtipo,
            ingredientes: formData.ingredientes,
            img: formData.img
          })
        });
        data = await response.json();
      }

      console.log("📡 Resposta da API:", { status: response.status, data });

      if (response.ok && data.success) {
        alert(produtoEditando ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
        resetFormulario();
        fetchProdutos();
      } else {
        console.error("❌ Erro na resposta:", data);
        alert(`Erro: ${data.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("💥 Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Tente novamente.");
    }
  };

  const resetFormulario = () => {
    setFormData({
      subc: "",
      nome: "",
      valor: "",
      vtipo: "",
      ingredientes: "",
      img: ""
    });
    setProdutoEditando(null);
    setMostrarFormulario(false);
  };

  const editarProduto = (produto: Produto) => {
    setFormData({
      subc: produto.subc || produto.subcategoria || "",
      nome: produto.nome,
      valor: produto.valor.toString(),
      vtipo: produto.vtipo,
      ingredientes: produto.ingredientes,
      img: produto.img
    });
    setProdutoEditando(produto);
    setMostrarFormulario(true);
  };

  const excluirProduto = async (produto: Produto) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/produtos/editar-existente", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: produto._id,
          colecaoOrigem: produto.colecaoOrigem
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchProdutos();
        alert("Produto excluído com sucesso!");
      } else {
        alert(`Erro: ${data.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto. Tente novamente.");
    }
  };

  const criarProdutoExemplo = async () => {
    setCriandoExemplo(true);
    
    try {
      const response = await fetch("/api/admin/produtos/exemplo", {
        method: "POST"
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Produto de exemplo criado com sucesso!");
        fetchProdutos(); // Recarregar lista
      } else {
        alert(`Erro: ${data.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao criar produto de exemplo:", error);
      alert("Erro ao criar produto de exemplo. Tente novamente.");
    } finally {
      setCriandoExemplo(false);
    }
  };


  const filteredProdutos = produtos.filter(produto => {
    const subcategoria = produto.subc || produto.subcategoria;
    return filtroSubcategoria === "todos" || subcategoria === filtroSubcategoria;
  });

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Carregando...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-10 text-center">
          <p className="text-red-600 text-lg">Acesso negado. Apenas administradores.</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (loadingProdutos) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Carregando produtos...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
            <p className="text-gray-600 mt-1">Gerencie o catálogo de produtos da panificadora</p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/painel" 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← Voltar ao Painel
            </Link>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Novo Produto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategoria:
            </label>
            <select
              value={filtroSubcategoria}
              onChange={(e) => setFiltroSubcategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="todos">Todas as Subcategorias</option>
              {subcategorias.map(subcategoria => (
                <option key={subcategoria} value={subcategoria}>{subcategoria}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Formulário de Produto */}
        {mostrarFormulario && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              {produtoEditando ? "Editar Produto" : "Novo Produto"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategoria *
                </label>
                  <select
                    value={formData.subc}
                    onChange={(e) => setFormData({...formData, subc: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Selecione uma subcategoria</option>
                    {subcategorias.map(subcategoria => (
                      <option key={subcategoria} value={subcategoria}>{subcategoria}</option>
                    ))}
                  </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredientes *
                </label>
                <textarea
                  value={formData.ingredientes}
                  onChange={(e) => setFormData({...formData, ingredientes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Descrição dos ingredientes..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Venda *
                </label>
                <select
                  value={formData.vtipo}
                  onChange={(e) => setFormData({...formData, vtipo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {TIPOS_VENDA.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem *
                </label>
                <input
                  type="url"
                  value={formData.img}
                  onChange={(e) => setFormData({...formData, img: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="https://i.imgur.com/EeDC5xQ.png"
                  required
                />
              </div>


              <div className="flex gap-2">
                <button
                  type="submit"
                  onClick={() => console.log("🔘 Botão Criar/Atualizar clicado!", formData)}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {produtoEditando ? "Atualizar" : "Criar"} Produto
                </button>
                <button
                  type="button"
                  onClick={resetFormulario}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
              
              {/* Debug: mostrar dados do formulário */}
              <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
                <strong>Debug:</strong> 
                {formData.nome ? ` Nome: ${formData.nome}` : ' (nome vazio)'}
                {formData.subc ? ` | Subc: ${formData.subc}` : ' | (subc vazio)'}
                {formData.valor ? ` | Valor: ${formData.valor}` : ' | (valor vazio)'}
                {formData.vtipo ? ` | Tipo: ${formData.vtipo}` : ' | (tipo vazio)'}
              </div>
            </form>
          </div>
        )}

        {/* Lista de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProdutos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {produtos.length === 0 ? "Nenhum produto encontrado" : "Nenhum produto encontrado"}
              </h3>
              <p className="text-gray-600 mb-6">
                {produtos.length === 0 
                  ? "Não há produtos cadastrados no sistema. Adicione o primeiro produto ou verifique se as coleções antigas têm produtos."
                  : "Tente ajustar os filtros para encontrar produtos."
                }
              </p>
              
              {produtos.length === 0 && (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setMostrarFormulario(true)}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    + Criar Primeiro Produto
                  </button>
                  
                  <button
                    onClick={criarProdutoExemplo}
                    disabled={criandoExemplo}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {criandoExemplo ? "Criando..." : "📦 Criar Produto de Exemplo"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredProdutos.map((produto) => (
              <div key={produto._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{produto.nome}</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {produto.vtipo}
                  </span>
                </div>

                {produto.img && (
                  <div className="w-full h-32 relative mb-3 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                    {produto.img.startsWith('http://') || produto.img.startsWith('https://') ? (
                      produto.img.includes('://i.imgur.com/') || produto.img.includes('://via.placeholder.com/') ? (
                        <Image
                          src={produto.img}
                          alt={produto.nome}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-xs text-red-600">❌ URL inválida</p>
                          <p className="text-xs text-gray-500 break-all">{produto.img}</p>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-gray-500">Sem imagem</p>
                    )}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Subcategoria:</strong> {produto.subc || produto.subcategoria}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Origem:</strong> {produto.colecaoOrigem}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {produto.valor.toFixed(2).replace(".", ",")}
                  </p>
                  {produto.ingredientes && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <strong>Ingredientes:</strong> {produto.ingredientes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editarProduto(produto)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => excluirProduto(produto)}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer showMap={false} />
    </>
  );
}
