"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Loading from "@/components/Loading";
import BreadcrumbNav from "@/components/BreadcrumbNav";

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
  permissao: string;
  dataCriacao: string;
  ultimaAtualizacao: string;
  picture?: string;
}

export default function ClienteProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params?.userId as string;
  const from = searchParams?.get('from'); // 'mensagens' ou 'usuarios'
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfileData = useCallback(async () => {
    if (!userId) return;
    
    console.log("🔍 Carregando dados do perfil para userId:", userId);
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/user/get-profile?userId=${userId}`);
      console.log("🔍 Response status:", response.status);
      
      const data = await response.json();
      console.log("🔍 Response data:", data);

      if (data.ok) {
        setProfileData(data.profile);
        console.log("✅ Perfil carregado com sucesso");
      } else {
        console.log("❌ Erro na resposta da API:", data.msg);
        setError(data.msg || "Erro ao carregar dados do cliente");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar perfil:", error);
      setError("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId, loadProfileData]);

  // Se não há userId, mostrar erro
  if (!userId) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erro</h2>
            <p className="text-gray-600 mb-6">ID do usuário não encontrado</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Voltar
            </button>
          </div>
        </main>
        <Footer showMap={false} />
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loading />
        </main>
        <Footer showMap={false} />
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erro</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              <button
                onClick={loadProfileData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tentar Novamente
              </button>
            </div>
          </div>
        </main>
        <Footer showMap={false} />
      </ProtectedRoute>
    );
  }

  if (!profileData) {
    return (
      <ProtectedRoute requiredPermission="administrador" redirectTo="/">
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-4">
            <div className="text-gray-500 text-6xl mb-4">👤</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Cliente não encontrado</h2>
            <p className="text-gray-600 mb-6">Os dados deste cliente não foram encontrados.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
          </div>
        </main>
        <Footer showMap={false} />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="administrador" redirectTo="/">
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <BreadcrumbNav 
            items={[
              { label: "Painel", href: "/painel", icon: "🏠", color: "blue" },
              ...(from === 'mensagens' ? [
                { label: "Mensagens", href: "/painel/mensagens", icon: "💬", color: "green" }
              ] : []),
              ...(from === 'usuarios' ? [
                { label: "Usuários", href: "/painel/usuarios", icon: "👥", color: "purple" }
              ] : []),
              ...(from === 'clientes' ? [
                { label: "Clientes", href: "/painel/cliente", icon: "👥", color: "pink" }
              ] : []),
              { label: "Perfil do Cliente", icon: "👤", color: "orange" }
            ]}
          />
          {/* Cabeçalho */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {profileData.picture ? (
                  <Image
                    src={profileData.picture}
                    alt={profileData.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full border-2 border-gray-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">{profileData.name}</h1>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Visualização
                    </span>
                  </div>
                  <p className="text-gray-600">@{userId}</p>
                  <p className="text-sm text-gray-500">{profileData.email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar
                </button>
                <button
                  onClick={() => router.push(`/painel/mensagens`)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Mensagens
                </button>
              </div>
            </div>
          </div>

          {/* Informações Pessoais */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Informações Pessoais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.name || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.email || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.phone || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.birthDate || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.gender || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissão
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.permissao || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Endereço
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.endereco.cep || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.endereco.rua || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.endereco.numero || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.endereco.bairro || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.endereco.cidade || "Não informado"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.endereco.estado || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          {/* Preferências */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Preferências
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Notificações</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profileData.preferences.notifications 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profileData.preferences.notifications ? 'Ativado' : 'Desativado'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Newsletter</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profileData.preferences.newsletter 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profileData.preferences.newsletter ? 'Ativado' : 'Desativado'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Promoções</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profileData.preferences.promotions 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profileData.preferences.promotions ? 'Ativado' : 'Desativado'}
                </span>
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Informações do Sistema
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Criação
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.dataCriacao 
                    ? new Date(profileData.dataCriacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "Não informado"
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Última Atualização
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {profileData.ultimaAtualizacao 
                    ? new Date(profileData.ultimaAtualizacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "Não informado"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer showMap={false} />
    </ProtectedRoute>
  );
}
