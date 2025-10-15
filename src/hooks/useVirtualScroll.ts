import { useState, useEffect, useRef, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Quantos itens renderizar fora da viewport
}

interface VirtualItem {
  index: number;
  offsetTop: number;
  height: number;
}

/**
 * Hook para virtualização de listas grandes
 * Renderiza apenas os itens visíveis + overscan
 * Melhora significativamente a performance com listas grandes
 * 
 * @param options - Configurações do virtual scroll
 * @returns { items, totalHeight, scrollToIndex }
 * 
 * @example
 * const { items, totalHeight } = useVirtualScroll({
 *   itemHeight: 100,
 *   containerHeight: 600,
 *   overscan: 5
 * });
 * 
 * return (
 *   <div style={{ height: containerHeight, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {items.map(item => (
 *         <div key={item.index} style={{ position: 'absolute', top: item.offsetTop, height: item.height }}>
 *           {data[item.index]}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 */
export function useVirtualScroll<T>(
  data: T[],
  options: UseVirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = data.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

    return {
      startIndex: Math.max(0, visibleStart - overscan),
      endIndex: Math.min(data.length - 1, visibleEnd + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, data.length]);

  const visibleItems = useMemo<VirtualItem[]>(() => {
    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
        height: itemHeight,
      });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  };

  return {
    items: visibleItems,
    totalHeight,
    scrollToIndex,
    containerRef,
  };
}

/**
 * Hook simplificado para virtualização
 */
export function useVirtualList<T>(
  data: T[],
  itemHeight: number,
  containerHeight: number
) {
  return useVirtualScroll(data, {
    itemHeight,
    containerHeight,
  });
}

