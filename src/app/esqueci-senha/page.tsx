"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function EsqueciSenhaPage() {
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
