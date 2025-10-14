"use client";

interface TimelineProps {
  statusAtual: 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  modalidade: 'entrega' | 'retirada';
  historico?: Array<{
    status: string;
    data: string;
  }>;
}

export default function PedidoTimeline({ statusAtual, modalidade, historico }: TimelineProps) {
  const etapas = modalidade === 'retirada' 
    ? [
        { status: 'pendente', label: 'Pedido Recebido', icon: '📋', tempo: '0min' },
        { status: 'confirmado', label: 'Confirmado', icon: '✅', tempo: '5-15min' },
        { status: 'preparando', label: 'Preparando', icon: '👨‍🍳', tempo: '20-40min' },
        { status: 'pronto', label: 'Pronto para Retirada', icon: '🍞', tempo: '40-60min' },
        { status: 'entregue', label: 'Retirado', icon: '✨', tempo: 'Concluído' }
      ]
    : [
        { status: 'pendente', label: 'Pedido Recebido', icon: '📋', tempo: '0min' },
        { status: 'confirmado', label: 'Confirmado', icon: '✅', tempo: '5-15min' },
        { status: 'preparando', label: 'Preparando', icon: '👨‍🍳', tempo: '20-40min' },
        { status: 'pronto', label: 'Saiu para Entrega', icon: '🚚', tempo: '40-70min' },
        { status: 'entregue', label: 'Entregue', icon: '✨', tempo: 'Concluído' }
      ];

  const statusIndex = etapas.findIndex(e => e.status === statusAtual);
  const isCancelado = statusAtual === 'cancelado';

  if (isCancelado) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-2xl">
            ❌
          </div>
          <div>
            <h4 className="font-semibold text-red-900">Pedido Cancelado</h4>
            <p className="text-sm text-red-700">Este pedido foi cancelado e não será processado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 md:p-6">
      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-lg">🕐</span>
        Acompanhamento do Pedido
      </h4>
      
      {/* Timeline Desktop */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Linha de conexão */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
              style={{ width: `${(statusIndex / (etapas.length - 1)) * 100}%` }}
            />
          </div>

          {/* Etapas */}
          <div className="relative flex justify-between">
            {etapas.map((etapa, index) => {
              const isCompleted = index <= statusIndex;
              const isCurrent = index === statusIndex;

              return (
                <div key={etapa.status} className="flex flex-col items-center" style={{ width: `${100 / etapas.length}%` }}>
                  {/* Ícone */}
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 text-white shadow-lg scale-110' 
                        : 'bg-gray-300 text-gray-600'
                    } ${isCurrent ? 'ring-4 ring-green-200 animate-pulse' : ''}`}
                  >
                    {etapa.icon}
                  </div>

                  {/* Label */}
                  <p className={`mt-2 text-xs md:text-sm font-medium text-center ${
                    isCompleted ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {etapa.label}
                  </p>

                  {/* Tempo estimado */}
                  <p className="text-xs text-gray-500 mt-1">
                    {etapa.tempo}
                  </p>

                  {/* Data/hora se houver histórico */}
                  {historico && historico.find(h => h.status === etapa.status) && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {new Date(historico.find(h => h.status === etapa.status)!.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Mobile */}
      <div className="md:hidden space-y-3">
        {etapas.map((etapa, index) => {
          const isCompleted = index <= statusIndex;
          const isCurrent = index === statusIndex;

          return (
            <div key={etapa.status} className="flex items-start gap-3">
              {/* Ícone e linha */}
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white shadow-md' 
                      : 'bg-gray-300 text-gray-600'
                  } ${isCurrent ? 'ring-4 ring-green-200 animate-pulse' : ''}`}
                >
                  {etapa.icon}
                </div>
                {index < etapas.length - 1 && (
                  <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-2">
                <p className={`font-medium ${isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                  {etapa.label}
                </p>
                <p className="text-xs text-gray-500">
                  Estimativa: {etapa.tempo}
                </p>
                {historico && historico.find(h => h.status === etapa.status) && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    ✓ {new Date(historico.find(h => h.status === etapa.status)!.data).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensagem atual */}
      <div className="mt-4 pt-4 border-t border-amber-300">
        <p className="text-sm text-gray-700">
          <strong>Status atual:</strong> {etapas[statusIndex]?.label || 'Processando'}
        </p>
        {statusIndex < etapas.length - 1 && (
          <p className="text-xs text-gray-600 mt-1">
            Próxima etapa: {etapas[statusIndex + 1]?.label}
          </p>
        )}
      </div>
    </div>
  );
}

