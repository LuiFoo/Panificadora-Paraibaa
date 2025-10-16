"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
// import { useToast } from "@/context/ToastContext"; // Toast desabilitado
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { validateAndFormatCEP } from "@/lib/cepUtils";

interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  endereco: Endereco;
  birthDate: string;
  gender: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    promotions: boolean;
  };
}

export default function ProfilePage() {
  const { user, setUser } = useUser();
  // const { showToast } = useToast(); // Toast desabilitado
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    },
    birthDate: "",
    gender: "",
    preferences: {
      notifications: true,
      newsletter: false,
      promotions: false,
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [cepError, setCepError] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepTimeout, setCepTimeout] = useState<NodeJS.Timeout | null>(null);
  

  // Carregar dados do usuário apenas uma vez
  useEffect(() => {
    const loadProfileData = async () => {
      if (user && !dataLoaded) {
        console.log("Carregando dados do perfil para:", user.email);
        try {
          const response = await fetch('/api/user/get-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Dados recebidos da API:", data);

          if (data.ok && data.profile) {
            // Carrega todos os dados do perfil do MongoDB
            const newProfileData = {
              name: data.profile.name || "",
              email: data.profile.email || "",
              phone: data.profile.phone || "",
              endereco: {
                rua: data.profile.endereco?.rua || data.profile.address || "",
                numero: data.profile.endereco?.numero || data.profile.number || "",
                bairro: data.profile.endereco?.bairro || data.profile.neighborhood || "",
                cidade: data.profile.endereco?.cidade || data.profile.city || "",
                estado: data.profile.endereco?.estado || data.profile.state || "",
                cep: data.profile.endereco?.cep || data.profile.zipCode || "",
              },
              birthDate: data.profile.birthDate || "",
              gender: data.profile.gender || "",
              preferences: data.profile.preferences || {
                notifications: true,
                newsletter: false,
                promotions: false,
              },
            };
            console.log("Dados do perfil carregados:", newProfileData);
            setProfileData(newProfileData);
          } else {
            console.log("API retornou erro, usando fallback");
            // Fallback para dados básicos do contexto
            setProfileData(prev => ({
              ...prev,
              name: user.name || "",
              email: user.email || "",
            }));
          }
          setDataLoaded(true);
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
          
          // Tratamento de erro específico
          if (error instanceof Error) {
            if (error.message.includes('fetch')) {
              console.log("Erro de rede - usando dados básicos");
            } else {
              console.log("Erro de API - usando dados básicos");
            }
          }
          
          // Fallback para dados básicos do contexto
          setProfileData(prev => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
          }));
          setDataLoaded(true);
        }
      } else if (!user) {
        router.push("/login");
      }
    };

    loadProfileData();
  }, [user, router, dataLoaded]);

  // Cleanup timeout quando componente for desmontado
  useEffect(() => {
    return () => {
      if (cepTimeout) {
        clearTimeout(cepTimeout);
      }
    };
  }, [cepTimeout]);

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
        setProfileData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            rua: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || prev.endereco.cidade,
            estado: data.uf || prev.endereco.estado,
            cep: validacao.formatted
          }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('preferences.')) {
      const preferenceKey = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [preferenceKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }));
    } else if (name === 'cep') {
      // Para o campo CEP - aceitar apenas números
      const valor = value.replace(/\D/g, ''); // Remove tudo que não é número
      const cepNumeros = valor;
      
      // Lógica ultra simples: só formata quando tem 6+ dígitos
      let cepFormatado = cepNumeros;
      if (cepNumeros.length >= 6) {
        cepFormatado = `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5)}`;
      }
      
      setProfileData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: cepFormatado,
        }
      }));
      
      setCepError("");
      
      // Buscar CEP quando tiver 8 dígitos
      if (cepTimeout) {
        clearTimeout(cepTimeout);
      }
      
      if (cepNumeros.length === 8) {
        const timeout = setTimeout(() => {
          buscarCep(cepNumeros);
        }, 500);
        setCepTimeout(timeout);
      }
    } else if (name.startsWith('endereco.')) {
      // Campos de endereço aninhados
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [field]: value,
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const handleSave = async () => {
    // Validar CEP antes de salvar
    if (profileData.endereco.cep) {
      const validacaoCep = validateAndFormatCEP(profileData.endereco.cep);
      if (!validacaoCep.isValid) {
        setCepError(validacaoCep.error || "CEP inválido");
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.ok) {
        // Atualizar dados do usuário no contexto
        setUser({
          ...user!,
          name: profileData.name,
        });
        
        console.log("Perfil atualizado com sucesso!");
        setIsEditing(false);
      } else {
        console.log(data.msg || "Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      console.log("Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Recarregar dados originais
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando perfil...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {user.picture ? (
              <Image
                src={user.picture}
                alt={user.name}
                width={80}
                height={80}
                className="rounded-full border-4 border-amber-200"
                onError={(e) => {
                  console.log("Erro ao carregar imagem:", user.picture);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log("Imagem carregada com sucesso:", user.picture);
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-amber-200 bg-gray-200 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais</p>
              {!dataLoaded && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                  <span className="text-sm text-gray-600">Carregando dados...</span>
                  <button
                    onClick={() => {
                      setDataLoaded(false);
                      window.location.reload();
                    }}
                    className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600"
                  >
                    Recarregar
                  </button>
                </div>
              )}
              {!user && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-red-600">Usuário não carregado</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem("usuario");
                      window.location.reload();
                    }}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Limpar Cache
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Editar Perfil
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                Informações Básicas
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={(e) => {
                    // Aceitar apenas números
                    const valor = e.target.value.replace(/\D/g, '');
                    let telefoneFormatado = valor;
                    
                    // Formatar telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
                    if (valor.length >= 2) {
                      telefoneFormatado = `(${valor.slice(0, 2)}`;
                      if (valor.length > 2) {
                        if (valor.length <= 6) {
                          telefoneFormatado += `) ${valor.slice(2)}`;
                        } else if (valor.length <= 10) {
                          telefoneFormatado += `) ${valor.slice(2, 6)}-${valor.slice(6)}`;
                        } else {
                          telefoneFormatado += `) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
                        }
                      }
                    }
                    
                    setProfileData(prev => ({
                      ...prev,
                      phone: telefoneFormatado
                    }));
                  }}
                  disabled={!isEditing}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={profileData.birthDate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero
                </label>
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="chapa">Chapa</option>
                  <option value="outro">Outro</option>
                  <option value="nao-informar">Prefiro não informar</option>
                </select>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                Endereço
              </h2>
              
              {/* CEP primeiro para preenchimento automático */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cep"
                    value={profileData.endereco.cep}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="14000-000 (Ribeirão Preto)"
                    maxLength={9}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 ${
                      cepError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-amber-500'
                    }`}
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

              {/* Campos de endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <textarea
                  name="endereco.rua"
                  value={profileData.endereco.rua}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Rua, avenida, etc..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  name="endereco.numero"
                  value={profileData.endereco.numero}
                  onChange={(e) => {
                    // Aceitar apenas números
                    const valor = e.target.value.replace(/\D/g, '');
                    setProfileData(prev => ({
                      ...prev,
                      endereco: {
                        ...prev.endereco,
                        numero: valor
                      }
                    }));
                  }}
                  disabled={!isEditing}
                  placeholder="Número"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  name="endereco.bairro"
                  value={profileData.endereco.bairro}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Bairro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="endereco.cidade"
                    value={profileData.endereco.cidade}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Cidade"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="endereco.estado"
                    value={profileData.endereco.estado}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>
            </div>
          </div>


          {/* Preferências */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Preferências
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="preferences.notifications"
                  checked={profileData.preferences.notifications}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 disabled:opacity-50"
                />
                <span className="text-gray-700">Receber notificações por email</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="preferences.newsletter"
                  checked={profileData.preferences.newsletter}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 disabled:opacity-50"
                />
                <span className="text-gray-700">Receber newsletter</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="preferences.promotions"
                  checked={profileData.preferences.promotions}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 disabled:opacity-50"
                />
                <span className="text-gray-700">Receber ofertas e promoções</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
