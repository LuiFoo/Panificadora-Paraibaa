'use client';

import { useState } from 'react';

export default function TesteBuscaPage() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<{ _id: string; login: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const testarBusca = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setErro('');
    
    try {
      console.log('🔍 Testando busca com:', query);
      const response = await fetch(`/api/buscar-usuarios?q=${encodeURIComponent(query)}`);
      console.log('📡 Resposta:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📊 Dados:', data);
      
      if (response.ok) {
        setResultados(data.usuarios || []);
      } else {
        setErro(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      setErro('Erro na requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Teste de Busca de Usuários</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digite um termo para buscar:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite nome ou login..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testarBusca}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {erro && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Erro:</strong> {erro}
            </div>
          )}

          {resultados.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">
                Resultados ({resultados.length}):
              </h3>
              <div className="space-y-2">
                {resultados.map((usuario) => (
                  <div key={usuario._id} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium">{usuario.name}</div>
                    <div className="text-sm text-gray-600">@{usuario.login}</div>
                    <div className="text-xs text-gray-500">ID: {usuario._id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultados.length === 0 && !loading && query && !erro && (
            <div className="text-gray-500 text-center py-4">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
