"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const { setUser } = useUser();

  const fazerLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!login || !password) {
      setMsg("Preencha todos os campos");
      return;
    }

    setMsg("Carregando...");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (data.ok) {
        setMsg(`Bem-vindo(a), ${data.user.name}!`);
        const userWithPassword = { ...data.user, password };
        localStorage.setItem("usuario", JSON.stringify(userWithPassword));
        setUser(userWithPassword);
      } else {
        setMsg(data.msg);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setMsg("Erro no servidor");
    }
  };

  return (
    <>
      <Header />

      <main className="my-10 min-h-[70vh] flex flex-col items-center justify-center p-4 bg-white">
        <form
          onSubmit={fazerLogin}
          className="flex flex-col gap-6 w-full max-w-md rounded-2xl shadow-xl p-10 bg-[#1f1f1f]"
        >
          <h1 className="text-2xl font-bold text-center text-white">
            Faça login em sua conta
          </h1>

          {/* Usuário */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#B69B4C]">Usuário</label>
            <input
              placeholder="Digite o nome do seu usuário"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="border border-gray-700 rounded-lg p-3 bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-[#B69B4C]"
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#B69B4C]">Senha</label>
            <input
              placeholder="Digite sua senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-700 rounded-lg p-3 bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-[#B69B4C]"
            />
            <Link
              href="/esqueci-senha"
              className="text-xs text-[#B69B4C] hover:underline mt-1 text-right"
            >
              Esqueci minha senha
            </Link>
          </div>

          {/* Botão entrar */}
          <button
            type="submit"
            className="bg-[#B69B4C] text-black font-semibold py-3 rounded-lg shadow-md hover:bg-[#d4b865] transition"
          >
            Entrar
          </button>

          {msg && (
            <p className="text-center text-sm mt-2 text-gray-300">{msg}</p>
          )}

          {/* Divisor OU */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-600" />
            <span className="text-gray-400 text-sm">OU</span>
            <div className="flex-1 h-px bg-gray-600" />
          </div>

          {/* Cadastro */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-300 text-sm">
              Ainda não tem cadastro?
            </p>
            <Link
              href="/cadastro"
              className="w-full border border-[#B69B4C] text-[#B69B4C] hover:bg-[#B69B4C] hover:text-black text-center px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Inscreva-se agora
            </Link>
          </div>
        </form>
      </main>

      <Footer showMap={false} />
    </>
  );
}
