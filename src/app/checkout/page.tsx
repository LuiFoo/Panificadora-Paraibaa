"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  complemento: string;
}

type ModalidadeEntrega = 'entrega' | 'retirada';

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { user } = useUser();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [modalidadeEntrega, setModalidadeEntrega] = useState<ModalidadeEntrega>('entrega');
  
  const [endereco, setEndereco] = useState<Endereco>({
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    cep: "",
    complemento: ""
  });
  
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [horaEntrega, setHoraEntrega] = useState("");
  const [salvarDados, setSalvarDados] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // Carregar dados salvos do usuário
  useEffect(() => {
    const carregarDadosSalvos = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/user-data?userId=${user.login}`);
        const data = await response.json();
        
        if (data.success && data.dadosSalvos) {
          if (data.dadosSalvos.telefone) {
            setTelefone(data.dadosSalvos.telefone);
          }
          if (data.dadosSalvos.endereco) {
            setEndereco(data.dadosSalvos.endereco);
          }
          setDadosCarregados(true);
        }
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
      }
    };

    carregarDadosSalvos();
  }, [user]);

  // Função para obter limites de horário baseado no dia da semana
  const getHorarioLimites = (data: string) => {
    if (!data) return { min: "06:00", max: "19:00" };
    
    const dataSelecionada = new Date(data + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
    const diaSemana = dataSelecionada.getDay(); // 0 = Domingo, 6 = Sábado
    
    if (diaSemana === 0) { // Domingo
      return { min: "06:00", max: "12:00" };
    } else { // Segunda a Sábado
      return { min: "06:00", max: "19:00" };
    }
  };

  const horarioLimites = getHorarioLimites(dataEntrega);

  // Limpar hora se não for válida para o dia selecionado
  useEffect(() => {
    if (dataEntrega && horaEntrega) {
      const limites = getHorarioLimites(dataEntrega);
      if (horaEntrega < limites.min || horaEntrega > limites.max) {
        setHoraEntrega("");
      }
    }
  }, [dataEntrega, horaEntrega]);

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Redirecionar se carrinho estiver vazio
  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
      router.push("/carrinho");
    }
  }, [cartItems, loading, router]);

  const total = cartItems.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validações do frontend
      if (modalidadeEntrega === 'entrega') {
        if (!endereco.rua || !endereco.numero || !endereco.bairro || !endereco.cidade) {
          setError("Preencha todos os campos obrigatórios do endereço para entrega");
          setLoading(false);
          return;
        }
        
        if (!dataEntrega || !horaEntrega) {
          setError("Data e hora de entrega são obrigatórias");
          setLoading(false);
          return;
        }
      }

      // Validar data e hora (tanto para entrega quanto retirada)
      if (!dataEntrega || !horaEntrega) {
        setError(`Data e hora ${modalidadeEntrega === 'entrega' ? 'de entrega' : 'de retirada'} são obrigatórias`);
        setLoading(false);
        return;
      }

      // Validar se a data não é no passado
      const dataHoraObj = new Date(dataEntrega + 'T' + horaEntrega);
      const agora = new Date();
      if (dataHoraObj <= agora) {
        setError(`Data e hora ${modalidadeEntrega === 'entrega' ? 'de entrega' : 'de retirada'} devem ser no futuro`);
        setLoading(false);
        return;
      }

      // Validar horário de funcionamento baseado no dia da semana
      const dataSelecionada = new Date(dataEntrega + 'T12:00:00');
      const diaSemana = dataSelecionada.getDay(); // 0 = Domingo
      const hora = parseInt(horaEntrega.split(':')[0]);
      const minuto = parseInt(horaEntrega.split(':')[1]);
      const horarioEmMinutos = hora * 60 + minuto;
      
      if (diaSemana === 0) { // Domingo: 6h às 12h
        if (horarioEmMinutos < 6 * 60 || horarioEmMinutos > 12 * 60) {
          setError(`Aos domingos, o horário ${modalidadeEntrega === 'entrega' ? 'de entrega' : 'de retirada'} deve ser entre 6h e 12h`);
          setLoading(false);
          return;
        }
      } else { // Segunda a Sábado: 6h às 19h
        if (horarioEmMinutos < 6 * 60 || horarioEmMinutos > 19 * 60) {
          setError(`De segunda a sábado, o horário ${modalidadeEntrega === 'entrega' ? 'de entrega' : 'de retirada'} deve ser entre 6h e 19h`);
          setLoading(false);
          return;
        }
      }

      if (!telefone || telefone.length < 10) {
        setError("Telefone deve ter pelo menos 10 dígitos");
        setLoading(false);
        return;
      }

      if (total > 500) {
        setError("Valor máximo do pedido é R$ 500,00. Para pedidos maiores, entre em contato conosco.");
        setLoading(false);
        return;
      }

      // Enviar pedido
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(user?.login || "")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtos: cartItems.map(item => ({
            produtoId: item.id,
            nome: item.nome,
            valor: item.valor,
            quantidade: item.quantidade,
            img: item.img
          })),
          modalidadeEntrega,
          endereco: modalidadeEntrega === 'entrega' ? endereco : null,
          dataRetirada: dataEntrega,
          horaRetirada: horaEntrega,
          telefone,
          observacoes
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Salvar dados do usuário se solicitado
        if (salvarDados) {
          try {
            await fetch("/api/user-data", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.login,
                telefone,
                endereco: modalidadeEntrega === 'entrega' ? endereco : null
              })
            });
          } catch (error) {
            console.error("Erro ao salvar dados do usuário:", error);
          }
        }
        
        setSuccess(true);
        clearCart();
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(data.error || "Erro ao processar pedido");
      }
    } catch (err) {
      console.error("Erro no checkout:", err);
      setError("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Redirecionando para login...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 text-lg">Carrinho vazio. Redirecionando...</p>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <h2 className="text-2xl font-bold mb-2">Pedido Realizado com Sucesso! 🎉</h2>
            <p>Seu pedido foi enviado e será processado em breve.</p>
            <p className="text-sm mt-2">Você será redirecionado para a página inicial em alguns segundos...</p>
          </div>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Finalizar Pedido</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Modalidade de Entrega</h2>
            
            {/* Seleção de Modalidade */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setModalidadeEntrega('entrega')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    modalidadeEntrega === 'entrega'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">🚚</div>
                  <div className="font-semibold">Entrega</div>
                  <div className="text-sm text-gray-600">Entregamos na sua casa</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setModalidadeEntrega('retirada')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    modalidadeEntrega === 'retirada'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="font-semibold">Retirada</div>
                  <div className="text-sm text-gray-600">Retire na panificadora</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos de Endereço - apenas para entrega */}
              {modalidadeEntrega === 'entrega' && (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Endereço de Entrega</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rua *
                      </label>
                      <input
                        type="text"
                        value={endereco.rua}
                        onChange={(e) => setEndereco({...endereco, rua: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={endereco.numero}
                        onChange={(e) => setEndereco({...endereco, numero: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={endereco.bairro}
                        onChange={(e) => setEndereco({...endereco, bairro: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={endereco.cidade}
                        onChange={(e) => setEndereco({...endereco, cidade: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={endereco.cep}
                        onChange={(e) => setEndereco({...endereco, cep: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={endereco.complemento}
                        onChange={(e) => setEndereco({...endereco, complemento: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Apartamento, casa, etc."
                      />
                    </div>
                  </div>
                  
                  {/* Campos de Data e Hora de Entrega */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-medium text-green-900 mb-2">📅 Data e Hora da Entrega</h3>
                    <div className="text-sm text-green-800 space-y-1 mb-4">
                      <p><strong>Horário de Funcionamento:</strong></p>
                      <p>Segunda a Sábado: 6h às 19h</p>
                      <p>Domingo: 6h às 12h</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          Data de Entrega *
                        </label>
                        <input
                          type="date"
                          value={dataEntrega}
                          onChange={(e) => setDataEntrega(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          Hora de Entrega *
                        </label>
                        <input
                          type="time"
                          value={horaEntrega}
                          onChange={(e) => setHoraEntrega(e.target.value)}
                          min={horarioLimites.min}
                          max={horarioLimites.max}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                        {dataEntrega && (
                          <p className="text-xs text-green-700 mt-1">
                            {new Date(dataEntrega + 'T12:00:00').getDay() === 0 
                              ? "⏰ Domingo: 6h às 12h" 
                              : "⏰ Seg-Sáb: 6h às 19h"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Mensagem sobre Status do Pedido - Entrega */}
                    <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-md p-3">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        ℹ️ Importante - Status do Pedido
                      </h4>
                      <div className="text-xs text-yellow-800 space-y-2">
                        <p>
                          📋 Após finalizar seu pedido, ele ficará com status <strong>&quot;Pendente&quot;</strong> até ser analisado por nossa equipe.
                        </p>
                        <p>
                          ✅ <strong>Se o pedido for ACEITO:</strong> O status mudará para <strong>&quot;Confirmado&quot;</strong> e realizaremos a entrega na data e hora escolhidas.
                        </p>
                        <p>
                          ❌ <strong>Se o pedido for RECUSADO:</strong> O status mudará para <strong>&quot;Cancelado&quot;</strong> e infelizmente não será possível realizar a entrega. Entraremos em contato para explicar o motivo.
                        </p>
                        <p className="mt-2 font-medium">
                          💡 Você pode acompanhar o status do seu pedido na página <strong>&quot;Meus Pedidos&quot;</strong>. Fique de olho!
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Informações de Retirada */}
              {modalidadeEntrega === 'retirada' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Informações para Retirada</h3>
                  <div className="text-sm text-blue-800 space-y-1 mb-4">
                    <p><strong>Endereço da Panificadora:</strong></p>
                    <p>Rua das Flores, 123 - Centro</p>
                    <p>João Pessoa - PB, 58000-000</p>
                    <p className="mt-2"><strong>Horário de Funcionamento:</strong></p>
                    <p>Segunda a Sábado: 6h às 19h</p>
                    <p>Domingo: 6h às 12h</p>
                    <p className="mt-2"><strong>Telefone:</strong> (83) 99999-9999</p>
                  </div>
                  
                  {/* Campos de Data e Hora de Retirada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">
                        Data de Retirada *
                      </label>
                      <input
                        type="date"
                        value={dataEntrega}
                        onChange={(e) => setDataEntrega(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">
                        Hora de Retirada *
                      </label>
                      <input
                        type="time"
                        value={horaEntrega}
                        onChange={(e) => setHoraEntrega(e.target.value)}
                        min={horarioLimites.min}
                        max={horarioLimites.max}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      {dataEntrega && (
                        <p className="text-xs text-blue-700 mt-1">
                          {new Date(dataEntrega + 'T12:00:00').getDay() === 0 
                            ? "⏰ Domingo: 6h às 12h" 
                            : "⏰ Seg-Sáb: 6h às 19h"}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Mensagem sobre Status do Pedido */}
                  <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-md p-3">
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      ℹ️ Importante - Status do Pedido
                    </h4>
                    <div className="text-xs text-yellow-800 space-y-2">
                      <p>
                        📋 Após finalizar seu pedido, ele ficará com status <strong>&quot;Pendente&quot;</strong> até ser analisado por nossa equipe.
                      </p>
                      <p>
                        ✅ <strong>Se o pedido for ACEITO:</strong> O status mudará para <strong>&quot;Confirmado&quot;</strong> e você poderá retirar seu pedido na data e hora escolhidas.
                      </p>
                      <p>
                        ❌ <strong>Se o pedido for RECUSADO:</strong> O status mudará para <strong>&quot;Cancelado&quot;</strong> e infelizmente não será possível realizar a retirada. Entraremos em contato para explicar o motivo.
                      </p>
                        <p className="mt-2 font-medium">
                          💡 Você pode acompanhar o status do seu pedido na página <strong>&quot;Meus Pedidos&quot;</strong>. Fique de olho!
                        </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Telefone - sempre obrigatório */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Instruções especiais para entrega..."
                />
              </div>

              {/* Checkbox para salvar dados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={salvarDados}
                    onChange={(e) => setSalvarDados(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-900">
                      💾 Salvar meus dados para próximas compras
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Seu telefone{modalidadeEntrega === 'entrega' ? ' e endereço' : ''} serão salvos para facilitar seus próximos pedidos
                    </p>
                    {dadosCarregados && (
                      <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                        <span>✓</span> Dados carregados automaticamente
                      </p>
                    )}
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading ? "Processando..." : "Confirmar Pedido"}
              </button>
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              {/* Modalidade de Entrega */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">
                      {modalidadeEntrega === 'entrega' ? '🚚' : '🏪'}
                    </span>
                    <div>
                      <p className="font-medium">
                        {modalidadeEntrega === 'entrega' ? 'Entrega' : 'Retirada no Local'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {modalidadeEntrega === 'entrega' 
                          ? `Entregamos na sua casa${dataEntrega && horaEntrega ? ` em ${new Date(dataEntrega + 'T' + horaEntrega).toLocaleString('pt-BR')}` : ''}` 
                          : `Retire na panificadora${dataEntrega && horaEntrega ? ` em ${new Date(dataEntrega + 'T' + horaEntrega).toLocaleString('pt-BR')}` : ''}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produtos */}
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-gray-600">Qtd: {item.quantidade}</p>
                  </div>
                  <p className="font-semibold">
                    R$ {(item.valor * item.quantidade).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
              
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer showMap={false} />
    </>
  );
}
