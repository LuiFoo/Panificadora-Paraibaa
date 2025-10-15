"use client";

/**
 * Exemplo de página otimizada usando todos os hooks e componentes
 * de performance implementados.
 * 
 * Este exemplo demonstra:
 * - useFetchCache para cache de dados
 * - useDebounce para busca
 * - useLazyLoad para lazy loading
 * - ProductCard otimizado
 * - Loading states
 * - Error handling
 */

import { useState } from 'react';
import { useFetchCache } from '@/hooks/useFetchCache';
import { useDebounce } from '@/hooks/useDebounce';
import ProductCard from '@/components/ProductCard';
import Loading, { LoadingSkeleton } from '@/components/Loading';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export default function OptimizedProductsPage() {
  const { addItem } = useCart();
  const { showToast } = useToast();

  // Busca com debounce
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Cache de produtos
  const { data: produtos, loading, error, refetch } = useFetchCache(
    'produtos',
    () => fetch('/api/produtos').then(r => r.json()),
    {
      ttl: 300000, // 5 minutos
      staleWhileRevalidate: true
    }
  );

  // Filtrar produtos
  const filteredProducts = produtos?.filter((produto: any) =>
    produto.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) || [];

  // Adicionar ao carrinho
  const handleAddToCart = async (id: string) => {
    const produto = produtos?.find((p: any) => p._id === id);
    if (!produto) return;

    const result = await addItem({
      id: produto._id,
      nome: produto.nome,
      valor: produto.valor,
      quantidade: 1,
      img: produto.img || '/images/default-product.png'
    });

    if (result.success) {
      showToast(`${produto.nome} adicionado ao carrinho!`, 'success');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Loading size="lg" text="Carregando produtos..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <LoadingSkeleton count={8} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Erro ao carregar produtos
          </div>
          <p className="text-red-500 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Nossos Produtos
        </h1>
        <p className="text-gray-600">
          Encontre os melhores produtos da nossa panificadora
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {debouncedSearch && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredProducts.length} produto(s) encontrado(s) para "{debouncedSearch}"
          </div>
        )}
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-500">
            Tente buscar por outro termo
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((produto: any) => (
            <ProductCard
              key={produto._id}
              id={produto._id}
              nome={produto.nome}
              valor={produto.valor}
              img={produto.img}
              ingredientes={produto.ingredientes}
              categoria={produto.categoria}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Botão de Atualizar */}
      <div className="mt-8 text-center">
        <button
          onClick={() => refetch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          🔄 Atualizar Lista
        </button>
      </div>
    </div>
  );
}

