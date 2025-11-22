"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Modal from "@/components/Modal";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { useUser } from "@/context/UserContext";
import { useState, useEffect, useCallback, useDeferredValue, useMemo, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { safeParseFloat, safeParseInt } from "@/lib/validation";
import type { Produto } from "@/types/Produto";

const TIPOS_VENDA = ["UN", "KG", "PCT", "DZ", "CENTO", "LITRO", "GRAMAS"];

const CATEGORIAS = [
  { nome: "Doces & Sobremesas", slug: "doces" },
  { nome: "Pães & Especiais", slug: "paes" },
  { nome: "Salgados & Lanches", slug: "salgados" },
  { nome: "Bebidas", slug: "bebidas" }
];


export default function ProdutosPage() {
  const { isAdmin, loading } = useUser();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const deferredProdutos = useDeferredValue(produtos);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "doces",
    subcategoria: "",
    preco: {
      valor: "",
      tipo: "UN",
      promocao: {
        ativo: false,
        valorPromocional: "",
        inicio: "",
        fim: ""
      }
    },
    estoque: {
      disponivel: true,
      quantidade: "",
      minimo: "",
      unidadeMedida: "UN"
    },
    imagem: {
      href: "",
      alt: ""
    },
    ingredientes: [] as string[]
  });

  // Persistência de rascunho no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("painel_produto_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Só aplica se não estiver editando um produto existente
        if (!produtoEditando) {
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    draftTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem("painel_produto_draft", JSON.stringify(formData));
      } catch {}
    }, 250);
    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [formData]);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftTimerRef = useRef<number | null>(null);

  const fetchProdutos = useCallback(async () => {
    setLoadingProdutos(true);
    setError("");
    try {
      const response = await fetch("/api/admin/produtos/todos");
      
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
        setError("Erro ao processar resposta do servidor");
        setIsSubmitting(false);
        return;
      }
      
      if (data.success) {
        startTransition(() => {
        // Normalizar produtos para garantir que destaque seja sempre boolean
        const produtosNormalizados = (data.produtos || []).map((p: Produto) => ({
          ...p,
          destaque: p.destaque === true
        })) as Produto[];
        setProdutos(produtosNormalizados);
        });
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
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
    startTransition(() => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown> || {}),
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    });
  };

  const handleArrayChange = (field: 'ingredientes', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  const handlePromocaoChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      preco: {
        ...prev.preco,
        promocao: {
          ...prev.preco.promocao,
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiplos cliques
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // 🐛 CORREÇÃO: Validar nome não vazio
      if (!formData.nome || formData.nome.trim().length === 0) {
        setError("Nome do produto é obrigatório");
        setIsSubmitting(false);
        return;
      }
      
      const produtoData = {
        nome: formData.nome.trim(),
        slug: formData.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        descricao: formData.descricao,
        categoria: {
          nome: CATEGORIAS.find(c => c.slug === formData.categoria)?.nome || "Doces & Sobremesas",
          slug: formData.categoria
        },
        subcategoria: formData.subcategoria,
        preco: {
          valor: safeParseFloat(formData.preco.valor),
          tipo: formData.preco.tipo,
          promocao: formData.preco.promocao.ativo ? {
            ativo: true,
            valorPromocional: safeParseFloat(formData.preco.promocao.valorPromocional),
            inicio: new Date(formData.preco.promocao.inicio),
            fim: new Date(formData.preco.promocao.fim)
          } : undefined
        },
        estoque: {
          disponivel: formData.estoque.disponivel,
          quantidade: formData.estoque.quantidade ? safeParseInt(formData.estoque.quantidade) : undefined,
          minimo: formData.estoque.minimo ? safeParseInt(formData.estoque.minimo) : undefined,
          unidadeMedida: formData.estoque.unidadeMedida
        },
        imagem: {
          href: formData.imagem.href,
          alt: formData.imagem.alt || formData.nome
        },
        ingredientes: formData.ingredientes,
        alergicos: [], // Campo removido do formulário, mas mantido para compatibilidade
        destaque: false, // Campo removido do formulário, mas mantido para compatibilidade
        tags: [], // Campo removido do formulário, mas mantido para compatibilidade
        status: "ativo"
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
        setError("Erro ao processar resposta do servidor");
        setIsSubmitting(false);
        return;
      }
      
      if (data.success) {
        setSuccess(produtoEditando ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        setMostrarFormulario(false);
        // Atualização otimista
        if (produtoEditando) {
          setProdutos(prev => prev.map(p => p._id === produtoEditando._id ? { ...p, ...produtoData } as Produto : p));
        } else {
          setProdutos(prev => [{
            _id: data.produtoId,
            ...produtoData,
            alergicos: [], // Campo removido do formulário, mas mantido para compatibilidade
            destaque: false, // Campo removido do formulário, mas mantido para compatibilidade
            tags: [], // Campo removido do formulário, mas mantido para compatibilidade
            avaliacao: { media: 0, quantidade: 0, usuarios: [] },
            criadoEm: new Date(),
            atualizadoEm: new Date()
          } as Produto, ...prev]);
        }
        setProdutoEditando(null);
        resetForm();
        try { localStorage.removeItem("painel_produto_draft"); } catch {}
        setIsSubmitting(false);
      } else {
        setError(data.error || "Erro ao salvar produto");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      setError("Erro ao conectar com o servidor");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      categoria: "doces",
      subcategoria: "",
      preco: {
        valor: "",
        tipo: "UN",
        promocao: {
          ativo: false,
          valorPromocional: "",
          inicio: "",
          fim: ""
        }
      },
      estoque: {
        disponivel: true,
        quantidade: "",
        minimo: "",
        unidadeMedida: "UN"
      },
      imagem: {
        href: "",
        alt: ""
      },
      ingredientes: [] as string[]
    });
  };

  const handleEdit = (produto: Produto) => {
    router.push(`/painel/produtos/editar/${produto._id}`);
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
            setError("Erro ao processar resposta do servidor");
            return;
          }
          
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

  const handleToggleStatus = useCallback(async (produto: Produto) => {
    const produtoId = produto._id;
    const statusAtual = produto.status;
    const newStatus = statusAtual === "inativo" ? "ativo" : "inativo";
    
    // Atualização otimista - atualizar UI imediatamente
    setProdutos(prev => {
      const index = prev.findIndex(p => p._id === produtoId);
      if (index === -1) return prev;
      const novo = [...prev];
      novo[index] = { ...novo[index], status: newStatus };
      return novo;
    });

    try {
      const response = await fetch(`/api/admin/produtos/toggle-status?id=${produtoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
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
        setError("Erro ao processar resposta do servidor");
        setIsSubmitting(false);
        return;
      }
      
      if (data.success) {
        setSuccess(`Produto ${newStatus === "ativo" ? "ativado" : "pausado"} com sucesso!`);
        setTimeout(() => setSuccess(""), 3000);
        // Garantir sincronização com servidor
        setProdutos(prev => {
          const index = prev.findIndex(p => p._id === produtoId);
          if (index === -1) return prev;
          const novo = [...prev];
          novo[index] = { ...novo[index], status: data.status || newStatus };
          return novo;
        });
      } else {
        // Reverter em caso de erro
        setProdutos(prev => {
          const index = prev.findIndex(p => p._id === produtoId);
          if (index === -1) return prev;
          const novo = [...prev];
          novo[index] = { ...novo[index], status: statusAtual };
          return novo;
        });
        setError(data.error || "Erro ao alterar status do produto");
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      // Reverter em caso de erro
      setProdutos(prev => {
        const index = prev.findIndex(p => p._id === produtoId);
        if (index === -1) return prev;
        const novo = [...prev];
        novo[index] = { ...novo[index], status: statusAtual };
        return novo;
      });
      setError("Erro ao conectar com o servidor");
    }
  }, []);

  const handleToggleDestaque = useCallback(async (produto: Produto) => {
    const produtoId = produto._id;
    const destaqueAtual = produto.destaque === true;
    const novoDestaque = !destaqueAtual;
    
    // Atualização otimista - atualizar UI imediatamente
    setProdutos(prev => {
      const index = prev.findIndex(p => p._id === produtoId);
      if (index === -1) return prev;
      const novo = [...prev];
      novo[index] = { ...novo[index], destaque: novoDestaque };
      return novo;
    });

    try {
      const response = await fetch(`/api/admin/produtos/toggle-destaque?id=${produtoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
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
        setError("Erro ao processar resposta do servidor");
        setIsSubmitting(false);
        return;
      }
      
      if (data.success) {
        setSuccess(`Produto ${data.destaque ? "marcado como destaque" : "removido dos destaques"} com sucesso!`);
        setTimeout(() => setSuccess(""), 3000);
        // Garantir sincronização com servidor
        setProdutos(prev => {
          const index = prev.findIndex(p => p._id === produtoId);
          if (index === -1) return prev;
          const novo = [...prev];
          novo[index] = { ...novo[index], destaque: data.destaque };
          return novo;
        });
      } else {
        // Reverter em caso de erro
        setProdutos(prev => {
          const index = prev.findIndex(p => p._id === produtoId);
          if (index === -1) return prev;
          const novo = [...prev];
          novo[index] = { ...novo[index], destaque: destaqueAtual };
          return novo;
        });
        setError(data.error || "Erro ao alterar destaque do produto");
      }
    } catch (err) {
      console.error("Erro ao alterar destaque:", err);
      // Reverter em caso de erro
      setProdutos(prev => {
        const index = prev.findIndex(p => p._id === produtoId);
        if (index === -1) return prev;
        const novo = [...prev];
        novo[index] = { ...novo[index], destaque: destaqueAtual };
        return novo;
      });
      setError("Erro ao conectar com o servidor");
    }
  }, []);


  const produtosFiltrados = useMemo(() => {
    return deferredProdutos.filter(produto => {
    const categoriaNome = produto.categoria?.nome || produto.subcategoria || "";
    const matchCategoria = filtroCategoria === "todos" || categoriaNome === filtroCategoria;
    const matchStatus = filtroStatus === "todos" || 
      (filtroStatus === "active" && (produto.status === "ativo" || !produto.status)) ||
      (filtroStatus === "pause" && produto.status === "inativo");
    return matchCategoria && matchStatus;
  });
  }, [deferredProdutos, filtroCategoria, filtroStatus]);

  const { totalProdutos, produtosAtivos, produtosPausados } = useMemo(() => {
    const total = deferredProdutos.length;
    let ativos = 0;
    let pausados = 0;
    for (const p of deferredProdutos) {
      const s = (p.status || '').toLowerCase();
      if (s === "inativo" || s === "pause" || s === "paused") {
        pausados++;
      } else {
        ativos++;
      }
    }
    return { totalProdutos: total, produtosAtivos: ativos, produtosPausados: pausados };
  }, [deferredProdutos]);

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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <BreadcrumbNav 
          items={[
            { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
            { label: "Produtos", icon: "🛍️", color: "orange" }
          ]}
        />
        
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Gerenciar Produtos</h1>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full border border-white/30">
                      {totalProdutos} produtos
                    </span>
                  </div>
                  <p className="text-white/90 text-sm md:text-base">Gerencie o catálogo completo de produtos da padaria</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/painel"
                  className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar
                </Link>
                <Link
                  href="/painel/produtos/novo-produto"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Novo Produto
                </Link>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess("")}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-avocado-100)] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                Resumo dos Produtos
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total de Produtos</p>
                  <p className="text-4xl font-bold text-blue-600 mb-1">{totalProdutos}</p>
                  <p className="text-xs text-gray-500">No catálogo</p>
                </div>
              </div>

              <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-green-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Produtos Ativos</p>
                  <p className="text-4xl font-bold text-green-600 mb-1">{produtosAtivos}</p>
                  <p className="text-xs text-gray-500">Disponíveis para venda</p>
                </div>
              </div>

              <div className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-amber-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Produtos Pausados</p>
                  <p className="text-4xl font-bold text-amber-600 mb-1">{produtosPausados}</p>
                  <p className="text-xs text-gray-500">Temporariamente indisponíveis</p>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoria</label>
                      <input
                        type="text"
                        name="subcategoria"
                        value={formData.subcategoria}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="Digite a subcategoria"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>

                {/* Preço e Promoção */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Preço e Promoção</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
                      <input
                        type="number"
                        name="preco.valor"
                        value={formData.preco.valor}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Venda</label>
                      <select
                        name="preco.tipo"
                        value={formData.preco.tipo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        {TIPOS_VENDA.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Promoção */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={formData.preco.promocao.ativo}
                        onChange={(e) => handlePromocaoChange('ativo', (e.target as HTMLInputElement).checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-gray-700">Ativar Promoção</label>
                    </div>
                    
                    {formData.preco.promocao.ativo && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Promocional (R$)</label>
                          <input
                            type="number"
                            value={formData.preco.promocao.valorPromocional}
                            onChange={(e) => handlePromocaoChange('valorPromocional', e.target.value)}
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Início da Promoção</label>
                          <input
                            type="date"
                            value={formData.preco.promocao.inicio}
                            onChange={(e) => handlePromocaoChange('inicio', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fim da Promoção</label>
                          <input
                            type="date"
                            value={formData.preco.promocao.fim}
                            onChange={(e) => handlePromocaoChange('fim', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estoque */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 Estoque</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="estoque.disponivel"
                        checked={formData.estoque.disponivel}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label className="text-sm font-medium text-gray-700">Disponível</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                      <input
                        type="number"
                        name="estoque.quantidade"
                        value={formData.estoque.quantidade}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mínimo</label>
                      <input
                        type="number"
                        name="estoque.minimo"
                        value={formData.estoque.minimo}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
                      <select
                        name="estoque.unidadeMedida"
                        value={formData.estoque.unidadeMedida}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        {TIPOS_VENDA.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subcategoria */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Subcategoria</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoria</label>
                    <input
                      type="text"
                      name="subcategoria"
                      value={formData.subcategoria}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Digite a subcategoria"
                    />
                  </div>
                </div>

                {/* Ingredientes */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🥘 Ingredientes</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes (separados por vírgula)</label>
                    <textarea
                      value={Array.isArray(formData.ingredientes) ? formData.ingredientes.join(', ') : (formData.ingredientes || '')}
                      onChange={(e) => handleArrayChange('ingredientes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="Farinha de trigo, açúcar, ovos, leite..."
                    />
                  </div>
                </div>

                {/* Imagem */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🖼️ Imagem</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
                      <input
                        type="url"
                        name="imagem.href"
                        value={formData.imagem.href}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Texto Alternativo</label>
                      <input
                        type="text"
                        name="imagem.alt"
                        value={formData.imagem.alt}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                </div>


                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Salvando...' : (produtoEditando ? 'Atualizar Produto' : 'Criar Produto')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setProdutoEditando(null);
                      setFormData({
                        nome: "",
                        descricao: "",
                        categoria: "doces",
                        subcategoria: "",
                        preco: {
                          valor: "",
                          tipo: "UN",
                          promocao: {
                            ativo: false,
                            valorPromocional: "",
                            inicio: "",
                            fim: ""
                          }
                        },
                        estoque: {
                          disponivel: true,
                          quantidade: "",
                          minimo: "",
                          unidadeMedida: "UN"
                        },
                        imagem: {
                          href: "",
                          alt: ""
                        },
                        ingredientes: []
                      });
                    try { localStorage.removeItem("painel_produto_draft"); } catch {}
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-gray-600 hover:shadow-xl border-2 border-gray-300 hover:border-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="p-6 md:p-8 bg-white border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Filtrar por Categoria</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-600)] focus:border-[var(--color-avocado-600)] transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <option value="todos">Todas as categorias</option>
                  <option value="Doces & Sobremesas">🍰 Doces & Sobremesas</option>
                  <option value="Pães & Especiais">🥖 Pães & Especiais</option>
                  <option value="Salgados & Lanches">🥐 Salgados & Lanches</option>
                  <option value="Bebidas">🥤 Bebidas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Filtrar por Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-600)] focus:border-[var(--color-avocado-600)] transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <option value="todos">Todos os status</option>
                  <option value="active">Apenas Ativos</option>
                  <option value="pause">Apenas Pausados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-7 h-7 text-[var(--color-avocado-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Lista de Produtos
                <span className="text-lg font-normal text-gray-500">({produtosFiltrados.length})</span>
              </h2>
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-7xl mb-4">🍞</div>
                <p className="text-gray-700 text-xl font-semibold mb-2">Nenhum produto encontrado</p>
                <p className="text-gray-500">Tente ajustar os filtros ou criar um novo produto</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtosFiltrados.map((produto) => (
                  <div key={produto._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-[var(--color-avocado-200)] group transform hover:-translate-y-2">
                    {/* Imagem do Produto */}
                    <div className="relative h-56 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 overflow-hidden">
                      {produto.imagem?.href || produto.img ? (
                        <>
                          <Image
                            src={produto.imagem?.href || (produto.img ?? '/images/placeholder.png')}
                            alt={produto.nome}
                            width={400}
                            height={224}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center">
                            <span className="text-gray-400 text-7xl block mb-2">🍞</span>
                            <span className="text-xs text-gray-500 font-medium">Sem imagem</span>
                          </div>
                        </div>
                      )}
                      {/* Badges sobre a imagem */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {produto.destaque === true && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold rounded-full shadow-xl backdrop-blur-sm border border-yellow-300/50">
                            ⭐ DESTAQUE
                          </span>
                        )}
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm border ${
                            produto.status === "inativo"
                              ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-300/50"
                              : produto.status === "sazonal"
                              ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-300/50"
                              : "bg-gradient-to-r from-green-400 to-green-500 text-white border-green-300/50"
                          }`}
                        >
                          {produto.status === "inativo" ? "⏸️ INATIVO" : 
                           produto.status === "sazonal" ? "🌿 SAZONAL" : "✅ ATIVO"}
                        </span>
                      </div>
                      {/* Overlay de ação rápida no hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Link
                          href={`/produtos/${produto._id}?from=panel`}
                          className="px-4 py-2 bg-white text-gray-800 rounded-xl font-semibold text-sm transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-100"
                        >
                          Ver Página
                        </Link>
                      </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="p-6">
                      {/* Título e Categoria */}
                      <div className="mb-4">
                        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-[var(--color-avocado-600)] transition-colors">
                          {produto.nome}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {produto.categoria?.nome && (
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                              {produto.categoria.nome}
                            </span>
                          )}
                          {produto.subcategoria && (
                            <span className="px-3 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">
                              {produto.subcategoria}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Preço */}
                      <div className="mb-5 pb-5 border-b-2 border-gray-100">
                        {produto.preco?.promocao?.ativo ? (
                          <div className="space-y-2">
                            <div className="flex items-baseline gap-3 flex-wrap">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Preço Promocional</p>
                                <span className="text-3xl font-bold text-[var(--color-avocado-600)]">
                                  R$ {produto.preco.promocao.valorPromocional.toFixed(2).replace(".", ",")}
                                </span>
                              </div>
                              <span className="ml-auto px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-lg shadow-lg">
                                PROMOÇÃO
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 line-through">
                              De: R$ {(produto.preco?.valor || produto.valor || 0).toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Preço</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-[var(--color-avocado-600)]">
                                R$ {(produto.preco?.valor || produto.valor || 0).toFixed(2).replace(".", ",")}
                              </span>
                              <span className="text-sm text-gray-500 font-medium">
                                / {produto.preco?.tipo || produto.vtipo || 'UN'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Informações Adicionais */}
                      <div className="space-y-3 mb-5">
                        {produto.estoque && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-0.5">Estoque</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {produto.estoque.quantidade || 'N/A'} {produto.estoque.unidadeMedida}
                                {produto.estoque.minimo && (
                                  <span className="text-gray-500 font-normal ml-2">
                                    (Mín: {produto.estoque.minimo})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        {produto.ingredientes && Array.isArray(produto.ingredientes) && produto.ingredientes.length > 0 && (
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-semibold text-blue-700 mb-1.5">Ingredientes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {produto.ingredientes.slice(0, 3).map((ing, idx) => (
                                <span key={idx} className="px-2 py-1 bg-white text-blue-700 text-xs rounded-lg border border-blue-200">
                                  {ing}
                                </span>
                              ))}
                              {produto.ingredientes.length > 3 && (
                                <span className="px-2 py-1 bg-white text-blue-600 text-xs rounded-lg border border-blue-200 font-semibold">
                                  +{produto.ingredientes.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {produto.alergicos && Array.isArray(produto.alergicos) && produto.alergicos.length > 0 && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                            <span className="text-lg flex-shrink-0">⚠️</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-red-700 mb-1">Alérgenos</p>
                              <p className="text-xs text-red-600 line-clamp-2">
                                {produto.alergicos.slice(0, 2).join(', ')}
                                {produto.alergicos.length > 2 && '...'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleEdit(produto)}
                          className="group/btn px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleDestaque(produto)}
                          className={`group/btn px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            produto.destaque === true
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                              : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white"
                          }`}
                          title={produto.destaque === true ? "Remover dos destaques" : "Marcar como destaque"}
                        >
                          <svg className={`w-5 h-5 group-hover/btn:scale-125 transition-transform ${produto.destaque === true ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {produto.destaque === true ? "Desmarcar" : "Marcar"}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(produto)}
                          className={`group/btn px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            produto.status === "inativo"
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                          }`}
                        >
                          {produto.status === "inativo" ? (
                            <>
                              <svg className="w-5 h-5 group-hover/btn:scale-125 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Ativar
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 group-hover/btn:scale-125 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pausar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(produto)}
                          className="group/btn px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
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