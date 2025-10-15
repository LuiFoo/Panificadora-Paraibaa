"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnifiedAuthForm from "@/components/UnifiedAuthForm";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const { user } = useUser();
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

  return (
    <>
      <Header />
      <UnifiedAuthForm
        initialMode="register"
        imageSrc="/images/fundo.png"
        imageAlt="Panificadora Paraíba"
      />
      <Footer showMap={false} />
    </>
  );
}
