"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnifiedAuthForm from "@/components/UnifiedAuthForm";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

export default function LoginPage() {
  const { user } = useUser();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirecionar se já estiver logado - versão simplificada e robusta
  useEffect(() => {
    if (user && !hasRedirected) {
      console.log("Usuário já está logado, verificando permissões...");
      console.log("Permissão do usuário:", user.permissao);
      
      setHasRedirected(true);
      
      // Sempre redirecionar para a página inicial quando acessar /login
      const targetPath = "/";
      
      console.log("Redirecionando para:", targetPath);
      
      // Pequeno delay para mostrar a mensagem
      setTimeout(() => {
        window.location.href = targetPath;
      }, 500);
    }
  }, [user, hasRedirected]);

  // Mostrar loading enquanto verifica autenticação
  if (user) {
    return (
      <>
        <Header />
        <main className="my-10 min-h-[70vh] flex flex-col items-center justify-center p-4 bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B69B4C] mx-auto mb-4"></div>
            <p className="text-gray-600">Você já está logado. Redirecionando...</p>
            <p className="text-sm text-gray-500 mt-2">
              Se não for redirecionado automaticamente, clique 
              <button 
                onClick={() => {
                  window.location.href = "/";
                }}
                className="text-[#B69B4C] underline ml-1"
              >
                aqui
              </button>
            </p>
          </div>
        </main>
        <Footer showMap={false} />
      </>
    );
  }

  return (
    <>
      <Header />
      <UnifiedAuthForm
        initialMode="login"
        imageSrc="/images/imagem3.png"
        imageAlt="Panificadora Paraíba"
      />
      <Footer showMap={false} />
    </>
  );
}
