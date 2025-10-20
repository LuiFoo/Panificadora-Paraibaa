"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";

export default function NovoProdutoPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    imagem: { href: "", alt: "", galeria: "" },
    ingredientes: [] as string[],
    alergicos: [] as string[],
    destaque: false,
    tags: [] as string[],
    status: "ativo"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        // @ts-expect-error dynamic
        [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleArray = (field: 'ingredientes' | 'alergicos' | 'tags', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value.split(',').map(v => v.trim()).filter(Boolean) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const cat = CATEGORIAS_CANONICAS.find(c => c.slug === formData.categoria);
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: { nome: cat?.nome || "", slug: cat?.slug || formData.categoria },
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
          alt: formData.imagem.alt || formData.nome,
          galeria: formData.imagem.galeria
            ? formData.imagem.galeria.split(',').map(s => s.trim()).filter(Boolean)
            : []
        },
        ingredientes: formData.ingredientes,
        alergicos: formData.alergicos,
        destaque: formData.destaque,
        tags: formData.tags,
        status: formData.status
      };

      const res = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Produto criado com sucesso!');
        startTransition(() => router.push('/painel/produtos'));
      } else {
        setError(data.error || 'Erro ao criar produto');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    }
  };

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <BreadcrumbNav 
            items={[
              { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
              { label: "Produtos", href: "/painel/produtos", icon: "🛍️", color: "orange" },
              { label: "Novo", icon: "➕", color: "green" }
            ]}
          />

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">Novo Produto</h1>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes (separados por vírgula)</label>
                      <textarea value={formData.ingredientes.join(', ')} onChange={(e) => handleArray('ingredientes', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alérgenos (separados por vírgula)</label>
                      <textarea value={formData.alergicos.join(', ')} onChange={(e) => handleArray('alergicos', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Galeria (URLs separadas por vírgula)</label>
                    <input name="imagem.galeria" value={formData.imagem.galeria} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="https://..., https://..." />
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ Tags</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (separadas por vírgula)</label>
                  <input value={formData.tags.join(', ')} onChange={(e) => handleArray('tags', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-sm" />
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">Salvar</button>
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


