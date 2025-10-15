import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook customizado para Intersection Observer
 * Útil para lazy loading, animações ao scroll, etc.
 * 
 * @param options - Opções do Intersection Observer
 * @returns { ref, isIntersecting, hasIntersected }
 * 
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.5,
 *   triggerOnce: true
 * });
 * 
 * return (
 *   <div ref={ref}>
 *     {isIntersecting && <HeavyComponent />}
 *   </div>
 * );
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): {
  ref: RefObject<HTMLDivElement>;
  isIntersecting: boolean;
  hasIntersected: boolean;
} {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting;
        setIsIntersecting(isCurrentlyIntersecting);

        if (isCurrentlyIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }

        // Desconectar se triggerOnce e já intersectou
        if (triggerOnce && hasIntersected) {
          observer.disconnect();
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
}

/**
 * Hook simplificado para lazy loading
 */
export function useLazyLoad(
  options: UseIntersectionObserverOptions = {}
): {
  ref: RefObject<HTMLDivElement>;
  shouldLoad: boolean;
} {
  const { ref, hasIntersected } = useIntersectionObserver({
    ...options,
    triggerOnce: true,
  });

  return { ref, shouldLoad: hasIntersected };
}

