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

  const fazerLogin = async () => {
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
        setMsg(`${data.msg}`);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setMsg("Erro no servidor");
    }
  };

  return (
    <>
      <Header />

      <main className="my-10 min-h-[70vh] flex flex-col items-center justify-center p-4 bg-white text-white">
        <div className="flex flex-col gap-4 w-full max-w-sm border border-gray-700 rounded-2xl shadow-xl p-8 bg-[#262626]">
          <h1 className="text-2xl font-bold text-center text-[#B69B4C]">
            Faça login em sua conta
          </h1>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Usuário</label>
            <input
              placeholder="Digite o nome do seu usuário"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="border border-gray-700 rounded-lg p-3 bg-zinc-800 text-white focus:outline-none focus:border-[#B69B4C]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Senha</label>
            <input
              placeholder="Digite sua senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-700 rounded-lg p-3 bg-zinc-800 text-white focus:outline-none focus:border-[#B69B4C]"
            />
          </div>

          <button
            onClick={fazerLogin}
            className="bg-[#B69B4C] text-black font-semibold py-3 rounded-lg hover:bg-amber-400 transition mt-2"
          >
            Entrar
          </button>

          {msg && (
            <p className="text-center text-sm mt-2 text-gray-300">{msg}</p>
          )}

          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-gray-400 text-sm">OU</p>
            <p className="text-gray-300 text-sm">Ainda não tem cadastro?</p>
            <Link
              href="/cadastro"
              className="w-full border border-[#B69B4C] text-[#B69B4C] hover:bg-amber-[#B69B4C] hover:text-black text-center px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </main>

      <Footer showMap={false} />
    </>
  );
}
