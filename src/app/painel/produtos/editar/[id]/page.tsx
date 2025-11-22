"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useTransition, useMemo, useEffect } from "react";
import { safeParseFloat, safeParseInt } from "@/lib/validation";
import type { Produto } from "@/types/Produto";

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const produtoId = params?.id as string | undefined;
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  
  const CATEGORIAS_CANONICAS = useMemo(() => ([
    { nome: "BOLOS DOCES ESPECIAIS", slug: "bolos-doces-especiais" },
    { nome: "DOCES INDIVIDUAIS", slug: "doces-individuais" },
    { nome: "PAES DOCES", slug: "paes-doces" },
    { nome: "PAES SALGADOS ESPECIAIS", slug: "paes-salgados-especiais" },
    { nome: "ROSCAS PAES ESPECIAIS", slug: "roscas-paes-especiais" },
    { nome: "SALGADOS ASSADOS LANCHES", slug: "salgados-assados-lanches" },
    { nome: "SOBREMESAS TORTAS", slug: "sobremesas-tortas" },
    { nome: "BEBIDAS", slug: "bebidas" }
  ]), []);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "bolos-doces-especiais",
    subcategoria: "",
    preco: {
      valor: "",
      tipo: "UN",
      custoProducao: "",
      promocao: { ativo: false, valorPromocional: "", inicio: "", fim: "" }
    },
    estoque: { disponivel: true, quantidade: "", minimo: "", unidadeMedida: "UN" },
    imagem: { href: "", alt: "", galeria: [] as string[] },
    ingredientes: [] as string[],
    alergicos: [] as string[],
    destaque: false,
    tags: [] as string[],
    status: "ativo" as "ativo" | "inativo" | "sazonal"
  });

  useEffect(() => {
    async function carregarProduto() {
      if (!produtoId) {
        setError("ID do produto não encontrado");
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/admin/produtos/${produtoId}`);
        const data = await res.json();
        
        if (res.ok && data.success && data.produto) {
          const produto: Produto = data.produto;
          setFormData({
            nome: produto.nome || "",
            descricao: produto.descricao || "",
            categoria: produto.categoria?.slug || "bolos-doces-especiais",
            subcategoria: produto.subcategoria || "",
            preco: {
              valor: (produto.preco?.valor || 0).toString(),
              tipo: produto.preco?.tipo || "UN",
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
              href: produto.imagem?.href || "",
              alt: produto.imagem?.alt || produto.nome || "",
              galeria: Array.isArray(produto.imagem?.galeria) ? produto.imagem.galeria : []
            },
            ingredientes: Array.isArray(produto.ingredientes) ? produto.ingredientes : [],
            alergicos: Array.isArray(produto.alergicos) ? produto.alergicos : [],
            destaque: produto.destaque || false,
            tags: Array.isArray(produto.tags) ? produto.tags : [],
            status: produto.status || "ativo"
          });
        } else {
          setError(data.error || "Produto não encontrado");
        }
      } catch {
        setError("Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    }

    if (produtoId) {
      carregarProduto();
    }
  }, [produtoId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
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
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleAddItem = (field: 'ingredientes' | 'alergicos' | 'tags' | 'galeria', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => {
      if (field === 'galeria') {
        const galeria = Array.isArray(prev.imagem.galeria) ? prev.imagem.galeria : [];
        if (!galeria.includes(value.trim())) {
          return {
            ...prev,
            imagem: {
              ...prev.imagem,
              galeria: [...galeria, value.trim()]
            }
          };
        }
        return prev;
      } else {
        const current = prev[field] || [];
        if (!current.includes(value.trim())) {
          return { ...prev, [field]: [...current, value.trim()] };
        }
        return prev;
      }
    });
  };

  const handleRemoveItem = (field: 'ingredientes' | 'alergicos' | 'tags' | 'galeria', index: number) => {
    setFormData(prev => {
      if (field === 'galeria') {
        const galeria = Array.isArray(prev.imagem.galeria) ? [...prev.imagem.galeria] : [];
        galeria.splice(index, 1);
        return {
          ...prev,
          imagem: {
            ...prev.imagem,
            galeria
          }
        };
      } else {
        const current = [...(prev[field] || [])];
        current.splice(index, 1);
        return { ...prev, [field]: current };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const cat = CATEGORIAS_CANONICAS.find(c => c.slug === formData.categoria);
      const precoValor = safeParseFloat(formData.preco.valor);
      if (precoValor <= 0) {
        setError("Preço deve ser maior que zero");
        return;
      }
      
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: { nome: cat?.nome || "", slug: cat?.slug || formData.categoria },
        subcategoria: formData.subcategoria,
        preco: {
          valor: precoValor,
          tipo: formData.preco.tipo,
          custoProducao: formData.preco.custoProducao ? safeParseFloat(formData.preco.custoProducao) : undefined,
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
          alt: formData.imagem.alt || formData.nome,
          galeria: Array.isArray(formData.imagem.galeria) ? formData.imagem.galeria : []
        },
        ingredientes: Array.isArray(formData.ingredientes) ? formData.ingredientes : [],
        alergicos: Array.isArray(formData.alergicos) ? formData.alergicos : [],
        destaque: formData.destaque,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        status: formData.status
      };

      if (!produtoId) {
        setError("ID do produto não encontrado");
        return;
      }

      const res = await fetch(`/api/admin/produtos/${produtoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Produto atualizado com sucesso!');
        setTimeout(() => {
          startTransition(() => router.push('/painel/produtos'));
        }, 1000);
      } else {
        setError(data.error || 'Erro ao atualizar produto');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
        <Footer showMap={false} />
      </ProtectedRoute>
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
              { label: "Produtos", href: "/painel/produtos", icon: "🛍️", color: "orange" },
              { label: "Editar", icon: "✏️", color: "purple" }
            ]}
          />

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">Editar Produto</h1>
              <Link href="/painel/produtos" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">Voltar</Link>
            </div>

            <div className="p-6">
              {error && <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">{error}</div>}
              {success && <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto *</label>
                      <input name="nome" value={formData.nome} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                      <select name="categoria" value={formData.categoria} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                        {CATEGORIAS_CANONICAS.map(c => (
                          <option key={c.slug} value={c.slug}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                  </div>
                </div>

                {/* Preço e Promoção */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Preço e Promoção</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
                      <input type="number" step="0.01" min="0" name="preco.valor" value={formData.preco.valor} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Venda</label>
                      <select name="preco.tipo" value={formData.preco.tipo} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                        {['UN','KG','PCT','DZ','CENTO','LITRO','GRAMAS'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custo de Produção (R$)</label>
                      <input type="number" step="0.01" min="0" name="preco.custoProducao" value={formData.preco.custoProducao} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input type="checkbox" checked={formData.preco.promocao.ativo} onChange={(e) => setFormData(p => ({ ...p, preco: { ...p.preco, promocao: { ...p.preco.promocao, ativo: (e.target as HTMLInputElement).checked }}}))} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <label className="text-sm font-medium text-gray-700">Ativar Promoção</label>
                    </div>
                    {formData.preco.promocao.ativo && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Promocional (R$)</label>
                          <input type="number" step="0.01" min="0" value={formData.preco.promocao.valorPromocional} onChange={(e) => setFormData(p => ({ ...p, preco: { ...p.preco, promocao: { ...p.preco.promocao, valorPromocional: e.target.value }}}))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Início da Promoção</label>
                          <input type="date" value={formData.preco.promocao.inicio} onChange={(e) => setFormData(p => ({ ...p, preco: { ...p.preco, promocao: { ...p.preco.promocao, inicio: e.target.value }}}))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fim da Promoção</label>
                          <input type="date" value={formData.preco.promocao.fim} onChange={(e) => setFormData(p => ({ ...p, preco: { ...p.preco, promocao: { ...p.preco.promocao, fim: e.target.value }}}))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm" />
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
                      <input type="checkbox" name="estoque.disponivel" checked={formData.estoque.disponivel} onChange={handleChange} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                      <label className="text-sm font-medium text-gray-700">Disponível</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                      <input type="number" min="0" name="estoque.quantidade" value={formData.estoque.quantidade} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mínimo</label>
                      <input type="number" min="0" name="estoque.minimo" value={formData.estoque.minimo} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
                      <select name="estoque.unidadeMedida" value={formData.estoque.unidadeMedida} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm">
                        {['UN','KG','PCT','DZ','CENTO','LITRO','GRAMAS'].map(t => <option key={t} value={t}>{t}</option>)}
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
                      <input name="subcategoria" value={formData.subcategoria} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm">
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="sazonal">Sazonal</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="destaque" checked={formData.destaque} onChange={handleChange} className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                      <label className="text-sm font-medium text-gray-700">Produto em Destaque</label>
                    </div>
                  </div>
                </div>

                {/* Ingredientes e Alérgenos */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🥘 Ingredientes e Alérgenos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          id="ingrediente-input-edit"
                          placeholder="Digite um ingrediente e pressione Enter"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              handleAddItem('ingredientes', input.value);
                              input.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('ingrediente-input-edit') as HTMLInputElement;
                            if (input?.value) {
                              handleAddItem('ingredientes', input.value);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-white rounded-lg border border-gray-200">
                        {formData.ingredientes.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                            {item}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem('ingredientes', idx)}
                              className="hover:text-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {formData.ingredientes.length === 0 && (
                          <span className="text-gray-400 text-sm">Nenhum ingrediente adicionado</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alérgenos</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          id="alergico-input-edit"
                          placeholder="Digite um alérgeno e pressione Enter"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              handleAddItem('alergicos', input.value);
                              input.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('alergico-input-edit') as HTMLInputElement;
                            if (input?.value) {
                              handleAddItem('alergicos', input.value);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-white rounded-lg border border-gray-200">
                        {formData.alergicos.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            {item}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem('alergicos', idx)}
                              className="hover:text-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {formData.alergicos.length === 0 && (
                          <span className="text-gray-400 text-sm">Nenhum alérgeno adicionado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Imagem */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🖼️ Imagem</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem *</label>
                      <input name="imagem.href" value={formData.imagem.href} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Texto Alternativo</label>
                      <input name="imagem.alt" value={formData.imagem.alt} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Galeria de Imagens</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        id="galeria-input-edit"
                        placeholder="Cole a URL da imagem e pressione Enter"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            handleAddItem('galeria', input.value);
                            input.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('galeria-input-edit') as HTMLInputElement;
                          if (input?.value) {
                            handleAddItem('galeria', input.value);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-white rounded-lg border border-gray-200">
                      {(Array.isArray(formData.imagem.galeria) ? formData.imagem.galeria : []).map((url, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm max-w-xs truncate">
                          {url}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem('galeria', idx)}
                            className="hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {(!Array.isArray(formData.imagem.galeria) || formData.imagem.galeria.length === 0) && (
                        <span className="text-gray-400 text-sm">Nenhuma imagem na galeria</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Tags</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      id="tag-input-edit"
                      placeholder="Digite uma tag e pressione Enter"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleAddItem('tags', input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('tag-input-edit') as HTMLInputElement;
                        if (input?.value) {
                          handleAddItem('tags', input.value);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-white rounded-lg border border-gray-200">
                    {formData.tags.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem('tags', idx)}
                          className="hover:text-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {formData.tags.length === 0 && (
                      <span className="text-gray-400 text-sm">Nenhuma tag adicionada</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">Salvar Alterações</button>
                  <Link href="/painel/produtos" className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium">Cancelar</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer showMap={false} />
    </ProtectedRoute>
  );
}

