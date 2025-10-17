"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useUser } from "@/context/UserContext";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Produto {
  _id: string;
  subc?: string;
  subcategoria?: string;
  nome: string;
  valor: number;
  vtipo: string;
  ingredientes: string;
  img: string;
  colecaoOrigem: string;
  status?: "pause" | "active";
  dataCriacao?: string | Date;
  dataAtualizacao?: string | Date;
}

const TIPOS_VENDA = ["UN", "KG", "PCT", "DZ"];

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
  const { isAdmin, loading } = useUser();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [subcategorias, setSubcategorias] = useState<string[]>(SUBCATEGORIAS_PADRAO);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [criandoExemplo, setCriandoExemplo] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    vtipo: "UN",
    ingredientes: "",
    img: "",
    subcategoria: "",
    status: "active"
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "info" | "warning" | "error" | "success" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProdutos = useCallback(async () => {
    setLoadingProdutos(true);
    setError("");
    try {
      console.log("🔍 Fazendo requisição para /api/admin/produtos/todos...");
      const response = await fetch("/api/admin/produtos/todos");
      console.log("📡 Resposta recebida:", response.status, response.statusText);
      
      const data = await response.json();
      console.log("📊 Dados recebidos:", { 
        success: data.success, 
        total: data.total, 
        produtos: data.produtos?.length || 0 
      });
      
      if (data.success) {
        setProdutos(data.produtos || []);
        
        // Extrair subcategorias únicas dos produtos
        const subcats = [...new Set((data.produtos || []).map((p: Produto) => p.subc || p.subcategoria).filter(Boolean))] as string[];
        if (subcats.length > 0) {
          setSubcategorias([...SUBCATEGORIAS_PADRAO, ...subcats.filter(sub => !SUBCATEGORIAS_PADRAO.includes(sub))]);
        }
      } else {
        console.error("❌ API retornou success: false:", data.error);
        setError(data.error || "Erro ao carregar produtos");
      }
    } catch (err) {
      console.error("❌ Erro ao buscar produtos:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoadingProdutos(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
      return;
    }
    
    if (isAdmin) {
      fetchProdutos();
    }
  }, [isAdmin, loading, router, fetchProdutos]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const produtoData = {
        ...formData,
        valor: parseFloat(formData.valor),
        subc: formData.subcategoria,
        colecaoOrigem: "ADMIN_PAINEL"
      };

      const url = produtoEditando 
        ? `/api/admin/produtos/${produtoEditando._id}`
        : "/api/admin/produtos";
      
      const method = produtoEditando ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produtoData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(produtoEditando ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        setMostrarFormulario(false);
        setProdutoEditando(null);
        setFormData({
          nome: "",
          valor: "",
          vtipo: "UN",
          ingredientes: "",
          img: "",
          subcategoria: "",
          status: "active"
        });
        fetchProdutos();
      } else {
        setError(data.error || "Erro ao salvar produto");
      }
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      setError("Erro ao conectar com o servidor");
    }
  };

  const handleEdit = (produto: Produto) => {
    setProdutoEditando(produto);
    setFormData({
      nome: produto.nome,
      valor: produto.valor.toString(),
      vtipo: produto.vtipo,
      ingredientes: produto.ingredientes,
      img: produto.img,
      subcategoria: produto.subc || produto.subcategoria || "",
      status: produto.status || "active"
    });
    setMostrarFormulario(true);
  };

  const handleDelete = (produto: Produto) => {
    setModalState({
      isOpen: true,
      type: "warning",
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja deletar o produto "${produto.nome}"? Esta ação não pode ser desfeita!`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/produtos/${produto._id}`, {
            method: "DELETE"
          });

          const data = await response.json();
          if (data.success) {
            setSuccess("Produto deletado com sucesso!");
            setTimeout(() => setSuccess(""), 3000);
            fetchProdutos();
          } else {
            setError(data.error || "Erro ao deletar produto");
          }
        } catch (err) {
          console.error("Erro ao deletar produto:", err);
          setError("Erro ao conectar com o servidor");
        }
      }
    });
  };

  const handleToggleStatus = async (produto: Produto) => {
    const newStatus = produto.status === "pause" ? "active" : "pause";
    
    try {
      const response = await fetch(`/api/admin/produtos/toggle-status?id=${produto._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Produto ${newStatus === "active" ? "ativado" : "pausado"} com sucesso!`);
        setTimeout(() => setSuccess(""), 3000);
        fetchProdutos();
      } else {
        setError(data.error || "Erro ao alterar status do produto");
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      setError("Erro ao conectar com o servidor");
    }
  };

  const handleCriarExemplo = async () => {
    setCriandoExemplo(true);
    try {
      const response = await fetch("/api/admin/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: "Pão de Açúcar Especial",
          valor: 8.50,
          vtipo: "UN",
          ingredientes: "Farinha de trigo, açúcar, fermento, ovos, manteiga",
          img: "/images/paoAcucar.jpg",
          subc: "PAES DOCES",
          status: "active",
          colecaoOrigem: "ADMIN_PAINEL"
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Produto exemplo criado com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        fetchProdutos();
      } else {
        setError(data.error || "Erro ao criar produto exemplo");
      }
    } catch (err) {
      console.error("Erro ao criar exemplo:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setCriandoExemplo(false);
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    const matchSubcategoria = filtroSubcategoria === "todos" || 
      (produto.subc || produto.subcategoria) === filtroSubcategoria;
    
    const matchStatus = filtroStatus === "todos" || 
      (filtroStatus === "active" && (produto.status === "active" || !produto.status)) ||
      (filtroStatus === "pause" && produto.status === "pause");

    return matchSubcategoria && matchStatus;
  });

  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter(p => p.status === "active" || !p.status).length;
  const produtosPausados = produtos.filter(p => p.status === "pause").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loadingProdutos) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <div className="max-w-6xl mx-auto">
        <BreadcrumbNav 
          items={[
            { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
            { label: "Produtos", icon: "🛍️", color: "orange" }
          ]}
        />
        
        <div className="bg-white rounded-lg shadow-md">
          {/* Cabeçalho */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">Gerenciar Produtos</h1>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {totalProdutos} produtos
                    </span>
                  </div>
                  <p className="text-gray-600">Gerencie o catálogo de produtos da padaria</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/painel"
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar
                </Link>
                <button
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {mostrarFormulario ? 'Cancelar' : 'Novo Produto'}
                </button>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border-l-4 border-green-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumo dos Produtos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total de Produtos</p>
                    <p className="text-2xl font-bold text-blue-800">{totalProdutos}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🍞</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Produtos Ativos</p>
                    <p className="text-2xl font-bold text-green-800">{produtosAtivos}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600">Produtos Pausados</p>
                    <p className="text-2xl font-bold text-amber-800">{produtosPausados}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">⏸️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário */}
          {mostrarFormulario && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {produtoEditando ? '✏️ Editar Produto' : '➕ Novo Produto'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                    <input
                      type="number"
                      name="valor"
                      value={formData.valor}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Venda</label>
                    <select
                      name="vtipo"
                      value={formData.vtipo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {TIPOS_VENDA.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoria</label>
                    <select
                      name="subcategoria"
                      value={formData.subcategoria}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {subcategorias.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <option value="active">Ativo</option>
                      <option value="pause">Pausado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes</label>
                  <textarea
                    name="ingredientes"
                    value={formData.ingredientes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
                  <input
                    type="url"
                    name="img"
                    value={formData.img}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    {produtoEditando ? 'Atualizar Produto' : 'Criar Produto'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setProdutoEditando(null);
                      setFormData({
                        nome: "",
                        valor: "",
                        vtipo: "UN",
                        ingredientes: "",
                        img: "",
                        subcategoria: "",
                        status: "active"
                      });
                    }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Subcategoria</label>
                <select
                  value={filtroSubcategoria}
                  onChange={(e) => setFiltroSubcategoria(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="todos">Todas as subcategorias</option>
                  {subcategorias.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="todos">Todos os status</option>
                  <option value="active">Apenas Ativos</option>
                  <option value="pause">Apenas Pausados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">🍞 Lista de Produtos</h2>
              <button
                onClick={handleCriarExemplo}
                disabled={criandoExemplo}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {criandoExemplo ? 'Criando...' : 'Criar Exemplo'}
              </button>
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-gray-500 text-6xl mb-4">🍞</div>
                <p className="text-gray-600 text-lg">Nenhum produto encontrado</p>
                <p className="text-gray-500 text-sm">Tente ajustar os filtros ou criar um novo produto</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtosFiltrados.map((produto) => (
                  <div key={produto._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {produto.img ? (
                          <Image
                            src={produto.img}
                            alt={produto.nome}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-gray-500 text-2xl">🍞</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800 truncate">{produto.nome}</h3>
                            <p className="text-sm text-gray-600">R$ {produto.valor.toFixed(2)} / {produto.vtipo}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {produto.subc || produto.subcategoria || 'Sem subcategoria'}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              produto.status === "pause"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {produto.status === "pause" ? "⏸️ Pausado" : "✅ Ativo"}
                          </span>
                        </div>
                        
                        {produto.ingredientes && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {produto.ingredientes}
                          </p>
                        )}
                        
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEdit(produto)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleToggleStatus(produto)}
                            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                              produto.status === "pause"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                            }`}
                          >
                            {produto.status === "pause" ? "▶️ Ativar" : "⏸️ Pausar"}
                          </button>
                          <button
                            onClick={() => handleDelete(produto)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors"
                          >
                            🗑️ Deletar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer showMap={false} />

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </ProtectedRoute>
  );
}