"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EsqueciSenhaPage() {
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

      <main className="my-10 min-h-[70vh] flex flex-col items-center justify-center p-4 bg-white">
        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md rounded-2xl shadow-xl p-10 bg-blue-200">
          <h1 className="text-2xl font-bold text-center text-white">
            Esqueci minha senha
          </h1>

          <p className="text-center text-lg text-white">
            Você perdeu sua conta permantemente ou até a Fabrica de Software III 👍
          </p>
        </div>
      </main>

      <Footer showMap={false} />
    </>
  );
}
