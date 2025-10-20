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
    custoProducao?: number;
    promocao?: {
      ativo: boolean;
      valorPromocional: number;
      inicio: Date;
      fim: Date;
    };
  };
  estoque: {
    disponivel: boolean;
    quantidade?: number;
    minimo?: number;
    unidadeMedida: string;
  };
  imagem: {
    href: string;
    alt: string;
  };
  ingredientes: string[];
  alergicos: string[];
  avaliacao: {
    media: number;
    quantidade: number;
  };
  destaque: boolean;
  tags: string[];
  status: "ativo" | "inativo" | "sazonal";
  criadoEm: Date;
  atualizadoEm: Date;
  // Campos de compatibilidade com sistema antigo
  subc?: string;
  valor?: number;
  vtipo?: string;
  img?: string;
  colecaoOrigem?: string;
  dataCriacao?: string | Date;
  dataAtualizacao?: string | Date;
}

const TIPOS_VENDA = ["UN", "KG", "PCT", "DZ", "CENTO", "LITRO", "GRAMAS"];

const CATEGORIAS = [
  { nome: "Doces & Sobremesas", slug: "doces" },
  { nome: "Pães & Especiais", slug: "paes" },
  { nome: "Salgados & Lanches", slug: "salgados" },
  { nome: "Bebidas", slug: "bebidas" }
];

const SUBCATEGORIAS_PADRAO = [
  "Tradicional",
  "Diet",
  "Sem Glúten",
  "Vegano",
  "Integral",
  "Artístico",
  "Especial",
  "Sazonal"
];

const ALERGENOS_COMUNS = [
  "Contém glúten",
  "Contém leite",
  "Contém ovos",
  "Contém soja",
  "Contém amendoim",
  "Contém castanhas",
  "Contém sulfitos",
  "Pode conter traços de amendoim",
  "Pode conter traços de castanhas"
];

export default function ProdutosPage() {
  const { isAdmin, loading } = useUser();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const deferredProdutos = useDeferredValue(produtos);
  const [subcategorias, setSubcategorias] = useState<string[]>(SUBCATEGORIAS_PADRAO);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [criandoExemplo, setCriandoExemplo] = useState(false);
  const [, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "doces",
    subcategoria: "",
    preco: {
      valor: "",
      tipo: "UN",
      custoProducao: "",
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
    ingredientes: [] as string[],
    alergicos: [] as string[],
    destaque: false,
    tags: [] as string[],
    status: "ativo"
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
  const draftTimerRef = useRef<number | null>(null);

  const fetchProdutos = useCallback(async () => {
    setLoadingProdutos(true);
    setError("");
    try {
      const response = await fetch("/api/admin/produtos/todos");
      const data = await response.json();
      
      if (data.success) {
        startTransition(() => {
        setProdutos(data.produtos || []);
        // Extrair subcategorias únicas dos produtos
        const subcats = [...new Set((data.produtos || []).map((p: Produto) => p.subcategoria || p.subc).filter(Boolean))] as string[];
        if (subcats.length > 0) {
            setSubcategorias([...SUBCATEGORIAS_PADRAO, ...subcats.filter(sub => !SUBCATEGORIAS_PADRAO.includes(sub))]);
        }
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

  const handleArrayChange = (field: 'ingredientes' | 'alergicos' | 'tags', value: string) => {
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
    setError("");
    setSuccess("");

    try {
      const produtoData = {
        nome: formData.nome,
        slug: formData.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        descricao: formData.descricao,
        categoria: {
          nome: CATEGORIAS.find(c => c.slug === formData.categoria)?.nome || "Doces & Sobremesas",
          slug: formData.categoria
        },
        subcategoria: formData.subcategoria,
        preco: {
          valor: parseFloat(formData.preco.valor),
          tipo: formData.preco.tipo,
          custoProducao: formData.preco.custoProducao ? parseFloat(formData.preco.custoProducao) : undefined,
          promocao: formData.preco.promocao.ativo ? {
            ativo: true,
            valorPromocional: parseFloat(formData.preco.promocao.valorPromocional),
            inicio: new Date(formData.preco.promocao.inicio),
            fim: new Date(formData.preco.promocao.fim)
          } : undefined
        },
        estoque: {
          disponivel: formData.estoque.disponivel,
          quantidade: formData.estoque.quantidade ? parseInt(formData.estoque.quantidade) : undefined,
          minimo: formData.estoque.minimo ? parseInt(formData.estoque.minimo) : undefined,
          unidadeMedida: formData.estoque.unidadeMedida
        },
        imagem: {
          href: formData.imagem.href,
          alt: formData.imagem.alt || formData.nome
        },
        ingredientes: formData.ingredientes,
        alergicos: formData.alergicos,
        destaque: formData.destaque,
        tags: formData.tags,
        status: formData.status
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
        // Atualização otimista
        if (produtoEditando) {
          setProdutos(prev => prev.map(p => p._id === produtoEditando._id ? { ...p, ...produtoData } as Produto : p));
        } else {
          setProdutos(prev => [{
            _id: data.produtoId,
            ...produtoData,
            avaliacao: { media: 0, quantidade: 0, usuarios: [] },
            criadoEm: new Date(),
            atualizadoEm: new Date()
          } as Produto, ...prev]);
        }
        setProdutoEditando(null);
        resetForm();
        try { localStorage.removeItem("painel_produto_draft"); } catch {}
      } else {
        setError(data.error || "Erro ao salvar produto");
      }
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      setError("Erro ao conectar com o servidor");
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
        custoProducao: "",
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
      ingredientes: [] as string[],
      alergicos: [] as string[],
      destaque: false,
      tags: [] as string[],
      status: "ativo"
    });
  };

  const handleEdit = (produto: Produto) => {
    setProdutoEditando(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || "",
      categoria: produto.categoria?.slug || "doces",
      subcategoria: produto.subcategoria || produto.subc || "",
      preco: {
        valor: (produto.preco?.valor || produto.valor || 0).toString(),
        tipo: produto.preco?.tipo || produto.vtipo || "UN",
        custoProducao: produto.preco?.custoProducao?.toString() || "",
        promocao: {
          ativo: produto.preco?.promocao?.ativo || false,
          valorPromocional: produto.preco?.promocao?.valorPromocional?.toString() || "",
          inicio: produto.preco?.promocao?.inicio ? new Date(produto.preco.promocao.inicio).toISOString().split('T')[0] : "",
          fim: produto.preco?.promocao?.fim ? new Date(produto.preco.promocao.fim).toISOString().split('T')[0] : ""
        }
      },
      estoque: {
        disponivel: produto.estoque?.disponivel ?? true,
        quantidade: produto.estoque?.quantidade?.toString() || "",
        minimo: produto.estoque?.minimo?.toString() || "",
        unidadeMedida: produto.estoque?.unidadeMedida || "UN"
      },
      imagem: {
        href: produto.imagem?.href || produto.img || "",
        alt: produto.imagem?.alt || produto.nome
      },
      ingredientes: Array.isArray(produto.ingredientes) ? produto.ingredientes : (produto.ingredientes ? [produto.ingredientes] : []),
      alergicos: Array.isArray(produto.alergicos) ? produto.alergicos : (produto.alergicos ? [produto.alergicos] : []),
      destaque: produto.destaque || false,
      tags: Array.isArray(produto.tags) ? produto.tags : (produto.tags ? [produto.tags] : []),
      status: produto.status || "ativo"
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
    const newStatus = produto.status === "inativo" ? "ativo" : "inativo";
    
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
        setSuccess(`Produto ${newStatus === "ativo" ? "ativado" : "pausado"} com sucesso!`);
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
          nome: "Bolo de Chocolate Especial",
          descricao: "Delicioso bolo de chocolate com brigadeiro artesanal",
          categoria: {
            nome: "Doces & Sobremesas",
            slug: "doces"
          },
          subcategoria: "Tradicional",
          preco: {
            valor: 45.00,
            tipo: "UN",
            custoProducao: 28.50,
            promocao: {
              ativo: true,
              valorPromocional: 39.90,
              inicio: new Date("2025-01-01"),
              fim: new Date("2025-01-31")
            }
          },
          estoque: {
            disponivel: true,
            quantidade: 12,
            minimo: 3,
            unidadeMedida: "UN"
          },
          imagem: {
            href: "/images/boloChocolate.jpg",
            alt: "Bolo de Chocolate Especial"
          },
          ingredientes: [
            "Farinha de trigo",
            "Açúcar",
            "Ovos",
            "Leite",
            "Chocolate em pó",
            "Brigadeiro artesanal"
          ],
          alergicos: [
            "Contém glúten",
            "Contém leite",
            "Pode conter traços de amendoim"
          ],
          destaque: true,
          tags: ["tradicional", "caseiro", "artesanal"],
          status: "ativo"
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

  const produtosFiltrados = useMemo(() => {
    return deferredProdutos.filter(produto => {
    const matchSubcategoria = filtroSubcategoria === "todos" || 
      (produto.subcategoria || produto.subc) === filtroSubcategoria;
    const matchStatus = filtroStatus === "todos" || 
      (filtroStatus === "active" && (produto.status === "ativo" || !produto.status)) ||
      (filtroStatus === "pause" && produto.status === "inativo");
    return matchSubcategoria && matchStatus;
  });
  }, [deferredProdutos, filtroSubcategoria, filtroStatus]);

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
      <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <BreadcrumbNav 
          items={[
            { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
            { label: "Produtos", icon: "🛍️", color: "orange" }
          ]}
          className="mt-2"
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
                <Link
                  href="/painel/produtos/novo-produto"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Novo Produto
                </Link>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                      <select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        {CATEGORIAS.map(cat => (
                          <option key={cat.slug} value={cat.slug}>{cat.nome}</option>
                        ))}
                      </select>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custo de Produção (R$)</label>
                      <input
                        type="number"
                        name="preco.custoProducao"
                        value={formData.preco.custoProducao}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      />
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

                {/* Categoria e Status */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Categoria e Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoria</label>
                      <select
                        name="subcategoria"
                        value={formData.subcategoria}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="sazonal">Sazonal</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="destaque"
                        checked={formData.destaque}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label className="text-sm font-medium text-gray-700">Produto em Destaque</label>
                    </div>
                  </div>
                </div>

                {/* Ingredientes e Alérgenos */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🥘 Ingredientes e Alérgenos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alérgenos (separados por vírgula)</label>
                      <textarea
                        value={Array.isArray(formData.alergicos) ? formData.alergicos.join(', ') : (formData.alergicos || '')}
                        onChange={(e) => handleArrayChange('alergicos', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="Contém glúten, contém leite..."
                      />
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">Alérgenos comuns:</p>
                        <div className="flex flex-wrap gap-1">
                          {ALERGENOS_COMUNS.map(alergeno => (
                            <button
                              key={alergeno}
                              type="button"
                              onClick={() => {
                                const novosAlergicos = [...formData.alergicos];
                                if (!novosAlergicos.includes(alergeno)) {
                                  novosAlergicos.push(alergeno);
                                  setFormData(prev => ({ ...prev, alergicos: novosAlergicos }));
                                }
                              }}
                              className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full hover:bg-orange-200 transition-colors"
                            >
                              + {alergeno}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
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

                {/* Tags */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Tags</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')}
                      onChange={(e) => handleArrayChange('tags', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      placeholder="tradicional, caseiro, artesanal..."
                    />
                  </div>
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
                        ingredientes: [],
                        img: "",
                        subcategoria: "",
                        status: "active"
                      });
                    try { localStorage.removeItem("painel_produto_draft"); } catch {}
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
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800 truncate">{produto.nome}</h3>
                              {produto.destaque && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                  ⭐ Destaque
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              R$ {(produto.preco?.valor || produto.valor || 0).toFixed(2)} / {produto.preco?.tipo || produto.vtipo || 'UN'}
                              {produto.preco?.promocao?.ativo && (
                                <span className="text-red-600 ml-2">
                                  (Promoção: R$ {produto.preco.promocao.valorPromocional.toFixed(2)})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {produto.subcategoria || produto.subc || 'Sem subcategoria'} • {produto.categoria?.nome || 'Sem categoria'}
                            </p>
                            {produto.estoque && (
                              <p className="text-xs text-gray-500">
                                Estoque: {produto.estoque.quantidade || 'N/A'} {produto.estoque.unidadeMedida}
                                {produto.estoque.minimo && ` (Mín: ${produto.estoque.minimo})`}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              produto.status === "inativo"
                                ? "bg-amber-100 text-amber-800"
                                : produto.status === "sazonal"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {produto.status === "inativo" ? "⏸️ Inativo" : 
                             produto.status === "sazonal" ? "🌿 Sazonal" : "✅ Ativo"}
                          </span>
                        </div>
                        
                        {produto.ingredientes && produto.ingredientes.length > 0 && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            Ingredientes: {Array.isArray(produto.ingredientes) ? produto.ingredientes.join(', ') : produto.ingredientes}
                          </p>
                        )}
                        {produto.alergicos && produto.alergicos.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ {Array.isArray(produto.alergicos) ? produto.alergicos.join(', ') : produto.alergicos}
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
                              produto.status === "inativo"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                            }`}
                          >
                            {produto.status === "inativo" ? "▶️ Ativar" : "⏸️ Pausar"}
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