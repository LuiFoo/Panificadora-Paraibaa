import { useState, useEffect, useRef } from 'react';

/**
 * Hook customizado para throttle de valores
 * Útil para limitar a frequência de atualizações (ex: scroll, resize)
 * 
 * @param value - Valor a ser throttled
 * @param limit - Limite em milissegundos (padrão: 300ms)
 * @returns Valor throttled
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScroll = useThrottle(scrollY, 100);
 * 
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY);
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, []);
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

