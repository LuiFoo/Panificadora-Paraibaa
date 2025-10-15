"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn, getSession } from "next-auth/react";

export default function CadastroPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useUser();
  const { showToast } = useToast();
  const router = useRouter();

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Redireciona para Google sem callback personalizado
      const result = await signIn("google", { 
        callbackUrl: "/"
      });
      
      // Se chegou aqui, significa que houve algum erro
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

  // Função de cadastro removida - agora usa apenas Google

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
                  Crie sua conta
                </h1>
                <p className="text-gray-600 text-sm">
                  Faça login com sua conta Google para criar sua conta na Panificadora Paraíba
                </p>
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
                      Conectando com Google...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Criar conta com Google
                    </>
                  )}
                </button>
              </div>

              {/* Informações sobre o processo */}
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">
                  Já possui uma conta?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 w-full justify-center border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Fazer login
                </Link>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">
                    Ao criar uma conta, você concorda com nossos
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

      <Footer showMap={false} />
    </>
  );
}
