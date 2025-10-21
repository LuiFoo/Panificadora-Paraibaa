"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateAndFormatCEP } from "@/lib/cepUtils";

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
  const { cartItems, clearCart, forcarAtualizacao } = useCart();
  const { user } = useUser();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validandoCarrinho, setValidandoCarrinho] = useState(false);
  const [tempoRedirecionamento, setTempoRedirecionamento] = useState(2);
  
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
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const cepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validacaoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirecionamentoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calcular data máxima (1 mês a partir de hoje)
  const getDataMaxima = () => {
    const hoje = new Date();
    const umMesDepois = new Date(hoje);
    umMesDepois.setMonth(umMesDepois.getMonth() + 1);
    return umMesDepois.toISOString().split('T')[0];
  };

  // Cleanup de todos os timeouts e intervalos quando componente for desmontado
  useEffect(() => {
    return () => {
      if (cepTimeoutRef.current) {
        clearTimeout(cepTimeoutRef.current);
      }
      if (validacaoTimeoutRef.current) {
        clearTimeout(validacaoTimeoutRef.current);
      }
      if (redirecionamentoIntervalRef.current) {
        clearInterval(redirecionamentoIntervalRef.current);
      }
    };
  }, []);

  // Função para buscar endereço por CEP (otimizada)
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;
    
    // Validar se é CEP de Ribeirão Preto
    const validacao = validateAndFormatCEP(cepLimpo);
    if (!validacao.isValid) {
      setCepError(validacao.error || "");
      return;
    }
    
    setCepError(""); // Limpar erro se CEP for válido
    setBuscandoCep(true);
    
    try {
      // Timeout de 10 segundos para evitar travamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Tentar ViaCEP primeiro
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        // Fallback para BrasilAPI se ViaCEP falhar
        console.log("ViaCEP falhou, tentando BrasilAPI...");
        const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (brasilApiResponse.ok) {
          const brasilApiData = await brasilApiResponse.json();
          data = {
            logradouro: brasilApiData.street || "",
            bairro: brasilApiData.neighborhood || "",
            localidade: brasilApiData.city || "",
            uf: brasilApiData.state || "",
            erro: false
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      if (!data.erro) {
        setEndereco(prev => ({
          ...prev,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          cep: validacao.formatted
        }));
      } else {
        setCepError("CEP não encontrado");
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setCepError("Busca demorou muito. Tente novamente.");
      } else {
        console.error("Erro ao buscar CEP:", error);
        setCepError("Erro ao buscar endereço. Tente novamente.");
      }
    } finally {
      setBuscandoCep(false);
    }
  };

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
    if (!data) return { min: "07:00", max: "18:30" };
    
    const dataSelecionada = new Date(data + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
    const diaSemana = dataSelecionada.getDay(); // 0 = Domingo, 6 = Sábado
    
    if (diaSemana === 0) { // Domingo - NÃO PERMITIDO
      return null; // Domingo não é permitido
    } else { // Segunda a Sábado
      return { min: "07:00", max: "18:30" };
    }
  };

  const horarioLimites = getHorarioLimites(dataEntrega);

  // Limpar hora se não for válida para o dia selecionado
  useEffect(() => {
    if (dataEntrega && horaEntrega) {
      const limites = getHorarioLimites(dataEntrega);
      if (limites && (horaEntrega < limites.min || horaEntrega > limites.max)) {
        setHoraEntrega("");
      } else if (!limites) {
        // Se limites for null (domingo), limpar a hora
        setHoraEntrega("");
      }
    }
  }, [dataEntrega]); // Removido horaEntrega das dependências para evitar loop

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

  // Validar carrinho antes do checkout (apenas uma vez)
  useEffect(() => {
    const validarCarrinho = async () => {
      if (cartItems.length === 0) return;
      
      setValidandoCarrinho(true);
      
      // Timeout de 10 segundos para evitar travamento
      validacaoTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Timeout na validação do carrinho");
        setValidandoCarrinho(false);
        setError("Timeout na validação do carrinho. Tente novamente.");
      }, 10000);
      
      try {
        console.log("🔄 Validando carrinho antes do checkout...");
        await forcarAtualizacao();
        console.log("✅ Carrinho validado com sucesso");
        if (validacaoTimeoutRef.current) {
          clearTimeout(validacaoTimeoutRef.current);
        }
      } catch (error) {
        console.error("❌ Erro ao validar carrinho:", error);
        setError("Erro ao validar carrinho. Recarregue a página e tente novamente.");
        if (validacaoTimeoutRef.current) {
          clearTimeout(validacaoTimeoutRef.current);
        }
      } finally {
        setValidandoCarrinho(false);
      }
    };

    // Só validar se não estiver já validando
    if (!validandoCarrinho && cartItems.length > 0) {
      validarCarrinho();
    }
  }, [cartItems.length, forcarAtualizacao]); // Adicionado forcarAtualizacao nas dependências

  const total = cartItems.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar e atualizar carrinho antes do checkout
      console.log("🔄 Validando carrinho antes de finalizar pedido...");
      await forcarAtualizacao();
      
      // Verificar se ainda há itens no carrinho após validação
      if (cartItems.length === 0) {
        setError("Seu carrinho foi atualizado e não contém mais produtos válidos. Redirecionando para o carrinho...");
        setLoading(false);
        setTimeout(() => {
          router.push("/carrinho");
        }, 2000);
        return;
      }
      // Validações do frontend
      if (modalidadeEntrega === 'entrega') {
        if (!endereco.rua || !endereco.numero || !endereco.bairro || !endereco.cidade) {
          setError("Preencha todos os campos obrigatórios do endereço para entrega");
          setLoading(false);
          return;
        }
        
        // Validar CEP se preenchido
        if (endereco.cep) {
          const validacaoCep = validateAndFormatCEP(endereco.cep);
          if (!validacaoCep.isValid) {
            setError(validacaoCep.error || "CEP inválido");
            setLoading(false);
            return;
          }
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

      // Validar se a data não ultrapassa 1 mês
      const umMesDepois = new Date(agora);
      umMesDepois.setMonth(umMesDepois.getMonth() + 1);
      const dataSelecionadaObj = new Date(dataEntrega + 'T12:00:00');
      if (dataSelecionadaObj > umMesDepois) {
        setError(`Pedidos só podem ser feitos para até 1 mês no futuro. Data máxima: ${umMesDepois.toLocaleDateString('pt-BR')}`);
        setLoading(false);
        return;
      }

      // Validar horário de funcionamento baseado no dia da semana
      const dataSelecionada = new Date(dataEntrega + 'T12:00:00');
      const diaSemana = dataSelecionada.getDay(); // 0 = Domingo
      const hora = parseInt(horaEntrega.split(':')[0]);
      const minuto = parseInt(horaEntrega.split(':')[1]);
      const horarioEmMinutos = hora * 60 + minuto;
      
      if (diaSemana === 0) { // Domingo - NÃO PERMITIDO
        setError(`Não é possível fazer pedidos aos domingos. Por favor, escolha outra data.`);
        setLoading(false);
        return;
      } else { // Segunda a Sábado: 7h às 18:30h
        if (horarioEmMinutos < 7 * 60 || horarioEmMinutos > (18 * 60 + 30)) {
          setError(`De segunda a sábado, o horário ${modalidadeEntrega === 'entrega' ? 'de entrega' : 'de retirada'} deve ser entre 7h e 18:30h`);
          setLoading(false);
          return;
        }
      }

      // Validar telefone (considerando formatação)
      const telefoneNumeros = telefone.replace(/\D/g, '');
      if (!telefone || telefoneNumeros.length < 10) {
        setError("Telefone deve ter pelo menos 10 dígitos");
        setLoading(false);
        return;
      }

      // Limite de valor removido - clientes podem fazer pedidos de qualquer valor

      // Enviar pedido
      const response = await fetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtos: cartItems.map(item => ({
            id: item.id,
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
      
      console.log("📋 Resposta da API:", { status: response.status, data });

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
        
        // Contador para redirecionamento
        redirecionamentoIntervalRef.current = setInterval(() => {
          setTempoRedirecionamento((prev) => {
            if (prev <= 1) {
              if (redirecionamentoIntervalRef.current) {
                clearInterval(redirecionamentoIntervalRef.current);
              }
              router.push("/meus-pedidos");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.log("❌ Erro na API:", data);
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

  if (validandoCarrinho) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-avocado-600)]"></div>
            <p className="text-gray-600 text-lg">Validando carrinho...</p>
            <p className="text-gray-500 text-sm">Verificando preços e disponibilidade dos produtos</p>
            <button
              onClick={() => {
                console.log("⏭️ Pulando validação do carrinho");
                setValidandoCarrinho(false);
              }}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Pular Validação
            </button>
          </div>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Ícone de sucesso */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-6">
                <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Mensagem principal */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              🎉 Pedido Feito com Sucesso! 🎉
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              ✅ Seu pedido foi registrado e está sendo processado!
            </p>
            <p className="text-gray-500 mb-4">
              📱 Você receberá uma confirmação assim que seu pedido for aprovado.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-900 font-semibold">Pedido Confirmado!</p>
                  <p className="text-green-700 text-sm">
                    Obrigado pela sua compra! Seu pedido está sendo preparado.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-900 font-semibold">Redirecionando para seus pedidos...</p>
                  <p className="text-blue-700 text-sm">
                    Você será levado para a página "Meus Pedidos" em {tempoRedirecionamento} segundo{tempoRedirecionamento !== 1 ? 's' : ''} para acompanhar seu pedido.
                  </p>
                </div>
              </div>
            </div>

            {/* Cards informativos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Acompanhe seu pedido</h3>
                    <p className="text-sm text-blue-700">
                      Acesse &quot;Meus Pedidos&quot; para ver o status em tempo real
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-500 rounded-full p-2 flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Tempo de preparo</h3>
                    <p className="text-sm text-yellow-700">
                      {modalidadeEntrega === 'retirada' 
                        ? `Retire em: ${new Date(dataEntrega).toLocaleDateString()} às ${horaEntrega}`
                        : 'Sua encomenda será processada em breve'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/meus-pedidos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                📋 Ver Meus Pedidos
              </Link>

              <Link
                href="/produtos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#B69B4C] font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-[#B69B4C]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Continuar Comprando
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Voltar ao Início
              </Link>
            </div>

            {/* Informação adicional */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                💬 Dúvidas? Entre em contato pelo{' '}
                <Link href="/chat" className="text-blue-600 hover:underline font-semibold">
                  chat online
                </Link>
                {' '}ou pelo{' '}
                <a href="https://api.whatsapp.com/send?phone=551636151947" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-semibold">
                  WhatsApp
                </a>
              </p>
            </div>
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
                  
                  {/* CEP primeiro para preenchimento automático */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={endereco.cep}
                          onChange={(e) => {
                            // Aceitar apenas números
                            const valor = e.target.value.replace(/\D/g, '');
                            const cepNumeros = valor;
                            
                            // Lógica ultra simples: só formata quando tem 6+ dígitos
                            let cepFormatado = cepNumeros;
                            if (cepNumeros.length >= 6) {
                              cepFormatado = `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5)}`;
                            }
                            
                            setEndereco({...endereco, cep: cepFormatado});
                            setCepError("");
                            
                            // Buscar CEP quando tiver 8 dígitos
                            if (cepTimeoutRef.current) {
                              clearTimeout(cepTimeoutRef.current);
                            }
                            
                            if (cepNumeros.length === 8) {
                              cepTimeoutRef.current = setTimeout(() => {
                                buscarCep(cepNumeros);
                              }, 500);
                            }
                          }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          cepError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-amber-500'
                        }`}
                        placeholder="14000-000 (Ribeirão Preto)"
                        maxLength={9}
                      />
                      {buscandoCep && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                        </div>
                      )}
                    </div>
                    {cepError && (
                      <p className="text-xs text-red-600 mt-1">
                        ❌ {cepError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      No momento limitado apenas para Ribeirão Preto
                    </p>
                  </div>

                  {/* Campos de endereço preenchidos automaticamente */}
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
                        onChange={(e) => {
                          const valor = e.target.value.replace(/\D/g, '');
                          setEndereco({...endereco, numero: valor});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Apenas números"
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
                  
                  {/* Campos de Data e Hora de Entrega */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-medium text-green-900 mb-2">📅 Data e Hora da Entrega</h3>
                    <div className="text-sm text-green-800 space-y-1 mb-4">
                      <p><strong>Horário de Funcionamento:</strong></p>
                      <p>✅ Segunda a Sábado: 07h às 18:30h</p>
                      <p>❌ Domingo: NÃO fazemos pedidos</p>
                      <p className="mt-2 text-blue-800">📅 <strong>Prazo:</strong> Pedidos até 1 mês no futuro</p>
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
                          max={getDataMaxima()}
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
                          min={horarioLimites?.min || "07:00"}
                          max={horarioLimites?.max || "18:30"}
                          disabled={!horarioLimites}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />
                        {dataEntrega && (
                          <p className={`text-xs mt-1 font-medium ${new Date(dataEntrega + 'T12:00:00').getDay() === 0 ? 'text-red-600' : 'text-green-700'}`}>
                            {new Date(dataEntrega + 'T12:00:00').getDay() === 0 
                              ? "❌ Domingo: NÃO é possível fazer pedidos" 
                              : "⏰ Seg-Sáb: 07h às 18:30h"}
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
                    <p>✅ Segunda a Sábado: 07h às 18:30h</p>
                    <p>❌ Domingo: NÃO fazemos pedidos</p>
                    <p className="mt-2 text-green-800">📅 <strong>Prazo:</strong> Pedidos até 1 mês no futuro</p>
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
                        max={getDataMaxima()}
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
                        min={horarioLimites?.min || "07:00"}
                        max={horarioLimites?.max || "18:30"}
                        disabled={!horarioLimites}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                      />
                      {dataEntrega && (
                        <p className={`text-xs mt-1 font-medium ${new Date(dataEntrega + 'T12:00:00').getDay() === 0 ? 'text-red-600' : 'text-blue-700'}`}>
                          {new Date(dataEntrega + 'T12:00:00').getDay() === 0 
                            ? "❌ Domingo: NÃO é possível fazer pedidos" 
                            : "⏰ Seg-Sáb: 07h às 18:30h"}
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
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '');
                    let telefoneFormatado = valor;
                    
                    // Formatar telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
                    if (valor.length >= 2) {
                      telefoneFormatado = `(${valor.slice(0, 2)})`;
                      if (valor.length > 2) {
                        if (valor.length <= 6) {
                          telefoneFormatado += ` ${valor.slice(2)}`;
                        } else if (valor.length <= 10) {
                          telefoneFormatado += ` ${valor.slice(2, 6)}-${valor.slice(6)}`;
                        } else {
                          telefoneFormatado += ` ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
                        }
                      }
                    }
                    
                    setTelefone(telefoneFormatado);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite apenas números (ex: 83999999999)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => {
                    if (e.target.value.length <= 250) {
                      setObservacoes(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Instruções especiais para entrega..."
                  maxLength={250}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${observacoes.length > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                    {observacoes.length}/250 caracteres
                  </span>
                  {observacoes.length > 200 && (
                    <span className="text-xs text-red-500">
                      Limite de caracteres próximo
                    </span>
                  )}
                </div>
              </div>

              {/* Checkbox para salvar dados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={salvarDados}
                    onChange={(e) => setSalvarDados((e.target as HTMLInputElement).checked)}
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
