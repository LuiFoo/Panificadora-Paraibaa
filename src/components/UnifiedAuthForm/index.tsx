"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface UnifiedAuthFormProps {
  initialMode?: 'login' | 'register';
  imageSrc: string;
  imageAlt: string;
}

export default function UnifiedAuthForm({
  initialMode = 'login',
  imageSrc,
  imageAlt
}: UnifiedAuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { showToast } = useToast();
  const { setUser } = useUser();
  const router = useRouter();


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signIn("google", { 
        callbackUrl: "/",
        redirect: false
      });
      
      if (result?.error) {
        console.error("Erro no Google Auth:", result.error);
        showToast("Erro ao conectar com Google", "error");
      }
    } catch (error) {
      console.error("Erro Google Auth:", error);
      showToast("Erro ao conectar com Google", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.ok && data.user) {
        const userData = {
          _id: data.user._id,
          login: data.user.login,
          password: 'email-auth', // Não armazenamos a senha real
          name: data.user.name,
          email: data.user.email,
          permissao: data.user.permissao,
          googleId: data.user.googleId,
          picture: data.user.picture,
        };
        localStorage.setItem("usuario", JSON.stringify(userData));
        setUser(userData);
        showToast("Login realizado com sucesso!", "success");
        
        // Redirecionar baseado na permissão
        if (data.user.permissao === "administrador") {
          console.log("Administrador logado, redirecionando para painel");
          router.push('/painel');
        } else {
          console.log("Usuário comum logado, redirecionando para página inicial");
          router.push('/');
        }
      } else {
        showToast(data.msg || "Erro ao fazer login", "error");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      showToast("Erro ao fazer login", "error");
    } finally {
      setIsLoading(false);
    }
  };


  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Faça login em sua conta';
      case 'register': return 'Crie sua conta';
      default: return 'Autenticação';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Entre com Google ou use seu email e senha';
      case 'register': return 'Faça login com Google para criar sua conta';
      default: return '';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Lado Esquerdo - Imagem */}
        <div className="hidden lg:block">
          <div className="relative">
            <Image
              src={imageSrc}
              alt={imageAlt}
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
                  {getTitle()}
                </h1>
                <p className="text-gray-600 text-sm">
                  {getSubtitle()}
                </p>
              </div>

            {/* Formulário de Login com Email/Senha */}
            {(mode === 'login') && (
              <form onSubmit={handleEmailLogin} className="mb-6">
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
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Sua senha"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            )}


            {/* Divisor */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Botão Google */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                    {mode === 'login' ? 'Entrando com Google...' : 'Conectando com Google...'}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {mode === 'login' ? 'Entrar com Google' : 'Criar conta com Google'}
                  </>
                )}
              </button>
            </div>

            {/* Links de navegação */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
              </p>
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="inline-flex items-center gap-2 w-full justify-center border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                {mode === 'login' ? 'Criar conta gratuita' : 'Fazer login'}
              </button>
            </div>

            {/* Informações Adicionais */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  {mode === 'login' 
                    ? 'Ao fazer login, você concorda com nossos'
                    : 'Ao criar uma conta, você concorda com nossos'
                  }
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/termos" className="text-xs text-amber-600 hover:underline">
                    Termos de Uso
                  </Link>
                  <span className="text-xs text-gray-400">•</span>
                  <Link href="/privacidade" className="text-xs text-amber-600 hover:underline">
                    Política de Privacidade
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
