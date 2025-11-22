"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { safeParseFloat, safeParseInt } from "@/lib/validation";

export default function NovoProdutoPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "",
    preco: {
      valor: "",
      tipo: "UN",
      promocao: { ativo: false, valorPromocional: "", inicio: "", fim: "" }
    },
    estoque: { disponivel: true, quantidade: "", minimo: "", unidadeMedida: "UN" },
    imagem: { href: "", alt: "" },
    ingredientes: [] as string[]
  });

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

  const handleAddItem = (field: 'ingredientes', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => {
      const current = prev[field] || [];
      if (!current.includes(value.trim())) {
        return { ...prev, [field]: [...current, value.trim()] };
      }
      return prev;
    });
  };

  const handleRemoveItem = (field: 'ingredientes', index: number) => {
    setFormData(prev => {
      const current = [...(prev[field] || [])];
      current.splice(index, 1);
      return { ...prev, [field]: current };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // Validar valores numéricos antes de enviar
      const precoValor = safeParseFloat(formData.preco.valor);
      if (precoValor <= 0) {
        setError("Preço deve ser maior que zero");
        return;
      }
      
      if (!formData.categoria) {
        setError("Categoria é obrigatória");
        return;
      }
      
      // Gerar slug da categoria
      const categoriaSlug = formData.categoria
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/&/g, 'e');
      
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: { nome: formData.categoria, slug: categoriaSlug },
        subcategoria: formData.categoria, // Manter para compatibilidade
        preco: {
          valor: precoValor,
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
        ingredientes: Array.isArray(formData.ingredientes) ? formData.ingredientes : [],
        alergicos: [], // Campo removido do formulário, mas mantido para compatibilidade
        destaque: false, // Campo removido do formulário, mas mantido para compatibilidade
        tags: [], // Campo removido do formulário, mas mantido para compatibilidade
        status: "ativo"
      };

      const res = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // 🐛 CORREÇÃO: Verificar se resposta é JSON válido antes de fazer parse
      let data;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          throw new Error("Resposta não é JSON");
        }
      } catch (jsonError) {
        console.error("Erro ao parsear JSON:", jsonError);
        setError("Erro ao processar resposta do servidor");
        return;
      }
      
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
              <Link href="/painel/produtos" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-gray-600 hover:shadow-xl border-2 border-gray-300 hover:border-gray-400">Voltar</Link>
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
                      <select name="categoria" value={formData.categoria} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm">
                        <option value="">Selecione uma categoria</option>
                        <option value="Doces & Sobremesas">🍰 Doces & Sobremesas</option>
                        <option value="Pães & Especiais">🥖 Pães & Especiais</option>
                        <option value="Salgados & Lanches">🥐 Salgados & Lanches</option>
                        <option value="Bebidas">🥤 Bebidas</option>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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


                {/* Ingredientes */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🥘 Ingredientes</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        id="ingrediente-input"
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
                          const input = document.getElementById('ingrediente-input') as HTMLInputElement;
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
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]">Salvar</button>
                  <Link href="/painel/produtos" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 bg-white text-gray-600 hover:shadow-xl border-2 border-gray-300 hover:border-gray-400">Cancelar</Link>
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


