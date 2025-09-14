"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const fazerLogin = async () => {
    if (!login || !password) {
      setMsg("❌ Preencha todos os campos");
      return;
    }

    setMsg("⏳ Carregando...");
    console.log("Tentando login com:", { login, password });

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();
      console.log("Resposta da API:", data);

      if (data.ok) {
        setMsg(`✅ Bem-vindo(a), ${data.user.name}!`);

        // Salvar no localStorage
        localStorage.setItem("usuario", JSON.stringify(data.user));
        console.log("Usuário salvo no localStorage:", data.user);

        // Recarregar a página para atualizar o Header
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setMsg(`❌ ${data.msg}`);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setMsg("❌ Erro no servidor");
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col gap-3 w-full max-w-sm border rounded-2xl shadow p-6">
          <h1 className="text-xl font-semibold text-center">Login</h1>

          <input
            placeholder="Usuário"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="border rounded p-2"
          />

          <input
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded p-2"
          />

          <button
            onClick={fazerLogin}
            className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition mt-2"
          >
            Entrar
          </button>

          <p className="text-center text-sm mt-2">{msg}</p>
        </div>
      </main>

      <Footer showMap={false} />
    </>
  );
}
