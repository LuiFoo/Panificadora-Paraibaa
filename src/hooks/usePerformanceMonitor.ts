import { useEffect, useRef } from 'react';

/**
 * Hook para monitorar performance de componentes
 * Útil para identificar componentes lentos
 * 
 * @param componentName - Nome do componente
 * @param enabled - Se deve monitorar (padrão: false em produção)
 * 
 * @example
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent', process.env.NODE_ENV === 'development');
 *   // ... resto do componente
 * }
 */
export function usePerformanceMonitor(
  componentName: string,
  enabled: boolean = false
) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;

      // Log apenas se render time for significativo (>16ms para 60fps)
      if (renderTime > 16) {
        console.warn(
          `⚠️ Performance Warning: ${componentName} took ${renderTime.toFixed(2)}ms to render (Render #${renderCount.current})`
        );
      }

      // Log detalhado em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `📊 ${componentName} - Render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  });
}

/**
 * Hook para medir tempo de execução de funções
 */
export function usePerformanceTimer() {
  const timers = useRef<Map<string, number>>(new Map());

  const start = (label: string) => {
    timers.current.set(label, performance.now());
  };

  const end = (label: string) => {
    const startTime = timers.current.get(label);
    if (!startTime) {
      console.warn(`Timer "${label}" not found`);
      return null;
    }

    const duration = performance.now() - startTime;
    timers.current.delete(label);

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  };

  return { start, end };
}

/**
 * Hook para medir tempo de carregamento de dados
 */
export function useDataLoadingMonitor(
  isLoading: boolean,
  dataName: string
) {
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (isLoading) {
      startTime.current = performance.now();
    } else if (startTime.current > 0) {
      const loadTime = performance.now() - startTime.current;

      if (loadTime > 1000) {
        console.warn(
          `⚠️ Slow Data Load: ${dataName} took ${loadTime.toFixed(2)}ms`
        );
      } else if (process.env.NODE_ENV === 'development') {
        console.log(
          `✅ ${dataName} loaded in ${loadTime.toFixed(2)}ms`
        );
      }

      startTime.current = 0;
    }
  }, [isLoading, dataName]);
}

/**
 * Hook para monitorar memória
 */
export function useMemoryMonitor(enabled: boolean = false) {
  useEffect(() => {
    if (!enabled || typeof performance.memory === 'undefined') return;

    const interval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memory = (performance as any).memory;
      const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

      console.log(
        `💾 Memory: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`
      );
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [enabled]);
}

