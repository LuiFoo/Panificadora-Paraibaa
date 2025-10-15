"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const { user } = useUser();
  const { showToast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'new-password'>('email');
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userEmail, setUserEmail] = useState('');

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      console.log("Usuário já está logado, redirecionando para página inicial...");
      router.push("/");
    }
  }, [user, router]);

  // Mostrar loading enquanto verifica autenticação
  if (user) {
    return (
      <>
        <Header />
        <main className="my-10 min-h-[70vh] flex flex-col items-center justify-center p-4 bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B69B4C] mx-auto mb-4"></div>
            <p className="text-gray-600">Você já está logado. Redirecionando...</p>
          </div>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simular verificação de email (em produção, enviaria email de recuperação)
      // Por agora, vamos direto para a etapa de nova senha
      setUserEmail(formData.email);
      setStep('new-password');
      showToast("Email verificado! Agora defina sua nova senha.", "success");
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      showToast("Erro ao verificar email", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      showToast("As senhas não coincidem", "error");
      return;
    }

    if (formData.newPassword.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (data.ok) {
        showToast("Senha redefinida com sucesso!", "success");
        router.push('/login');
      } else {
        showToast(data.msg || "Erro ao redefinir senha", "error");
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      showToast("Erro ao redefinir senha", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Lado Esquerdo - Imagem */}
          <div className="hidden lg:block">
            <div className="relative">
              <Image
                src="/images/fundo.png"
                alt="Panificadora Paraíba"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl object-cover"
                priority
              />
            </div>
          </div>

          {/* Lado Direito - Formulário */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              
              {/* Cabeçalho */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {step === 'email' ? 'Esqueci minha senha' : 'Nova senha'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {step === 'email' 
                    ? 'Digite seu email para redefinir a senha'
                    : `Definindo nova senha para ${userEmail}`
                  }
                </p>
              </div>

              {/* Formulário de Email */}
              {step === 'email' && (
                <form onSubmit={handleEmailSubmit} className="mb-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verificando...' : 'Verificar Email'}
                  </button>
                </form>
              )}

              {/* Formulário de Nova Senha */}
              {step === 'new-password' && (
                <form onSubmit={handlePasswordReset} className="mb-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Digite a senha novamente"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                  </button>
                </form>
              )}

              {/* Links de navegação */}
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">
                  Lembrou da senha?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 w-full justify-center border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Voltar ao Login
                </Link>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Se você tem uma conta Google, use o login com Google
                  </p>
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
