"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { useLazyLoad } from '@/hooks/useIntersectionObserver';

interface ProductCardProps {
  id: string;
  nome: string;
  valor: number;
  img: string;
  ingredientes?: string;
  categoria?: string;
  onAddToCart?: (id: string) => void;
  className?: string;
}

/**
 * Componente de card de produto otimizado
 * Usa React.memo para evitar re-renders desnecessários
 * Implementa lazy loading para melhor performance
 */
function ProductCardComponent({
  id,
  nome,
  valor,
  img,
  ingredientes,
  categoria,
  onAddToCart,
  className = ''
}: ProductCardProps) {
  const { ref, shouldLoad } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(id);
  };

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden ${className}`}
    >
      <Link href={`/produtos/${id}`}>
        <div className="relative aspect-square">
          {shouldLoad ? (
            <OptimizedImage
              src={img}
              alt={nome}
              className="w-full h-full"
              priority={false}
              quality={80}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/produtos/${id}`}>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {nome}
          </h3>
        </Link>

        {ingredientes && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {ingredientes}
          </p>
        )}

        {categoria && (
          <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full mb-3">
            {categoria}
          </span>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-green-600">
            R$ {valor.toFixed(2).replace('.', ',')}
          </span>

          {shouldLoad && onAddToCart && (
            <button
              onClick={handleAddToCart}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              aria-label={`Adicionar ${nome} ao carrinho`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoização para evitar re-renders desnecessários
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders
  return (
    prevProps.id === nextProps.id &&
    prevProps.nome === nextProps.nome &&
    prevProps.valor === nextProps.valor &&
    prevProps.img === nextProps.img &&
    prevProps.ingredientes === nextProps.ingredientes &&
    prevProps.categoria === nextProps.categoria
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

