import { useState, useEffect, useRef } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live em milissegundos (padrão: 5 minutos)
  staleWhileRevalidate?: boolean; // Retornar cache enquanto revalida
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

/**
 * Hook customizado para cache de requisições
 * Evita requisições duplicadas e mantém cache com TTL
 * 
 * @param key - Chave única para o cache
 * @param fetcher - Função que retorna Promise com os dados
 * @param options - Opções de cache
 * @returns { data, loading, error, refetch }
 * 
 * @example
 * const { data, loading, error } = useFetchCache(
 *   'produtos',
 *   () => fetch('/api/produtos').then(r => r.json()),
 *   { ttl: 300000 } // 5 minutos
 * );
 */
export function useFetchCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 300000, staleWhileRevalidate = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const fetchData = async (force = false) => {
    const cache = cacheRef.current.get(key);
    const now = Date.now();

    // Verificar se há cache válido
    if (!force && cache && (now - cache.timestamp) < ttl) {
      setData(cache.data);
      setLoading(false);
      setError(null);
      return;
    }

    // Verificar se já há uma requisição em andamento
    if (cache?.promise) {
      try {
        const result = await cache.promise;
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
      return;
    }

    // Retornar cache antigo enquanto revalida (stale-while-revalidate)
    if (staleWhileRevalidate && cache) {
      setData(cache.data);
    }

    setLoading(true);
    setError(null);

    // Criar nova requisição
    const promise = fetcher();
    cacheRef.current.set(key, { 
      data: cache?.data || null as T | null, 
      timestamp: now,
      promise 
    });

    try {
      const result = await promise;
      
      // Atualizar cache
      cacheRef.current.set(key, {
        data: result,
        timestamp: Date.now()
      });
      
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      // Remover promise do cache em caso de erro
      const currentCache = cacheRef.current.get(key);
      if (currentCache) {
        delete currentCache.promise;
      }
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const refetch = () => fetchData(true);

  // Limpar cache expirado periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      cacheRef.current.forEach((entry, key) => {
        if (now - entry.timestamp > ttl && !entry.promise) {
          cacheRef.current.delete(key);
        }
      });
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [ttl]);

  return { data, loading, error, refetch };
}

