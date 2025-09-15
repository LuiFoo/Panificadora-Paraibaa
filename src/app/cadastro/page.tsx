"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const { setUser } = useUser();

  const fazerCadastro = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!nome || !login || !password) {
      setMsg("Preencha todos os campos");
      return;
    }

    setMsg("Carregando...");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome, login, password }),
      });

      const data = await res.json();

      if (data.ok && data.user) {
        // Cria objeto compatível com User e salva no localStorage
        const novoUsuario = {
          _id: data.user._id,
          login: data.user.login,
          password, // mantém a senha para autenticação futura
          name: data.user.name,
          permissao: data.user.permissao || "usuario", // padrão "usuario"
        };

        localStorage.setItem("usuario", JSON.stringify(novoUsuario));
        setUser(novoUsuario);

        setMsg(data.msg || `Bem-vindo(a), ${data.user.name}!`);

        setTimeout(() => {
          window.location.href = "/";
        }, 2500);
      } else {
        setMsg(data.msg || "Erro ao cadastrar usuário");
      }
    } catch (err) {
      console.error("Erro no cadastro:", err);
      setMsg("Erro no servidor");
    }
  };

  return (
    <>
      <Header />

      <main className="my-10 min-h-[70vh] flex flex-col items-center justify-center p-4 bg-white">
        <form
          onSubmit={fazerCadastro}
          className="flex flex-col gap-6 w-full max-w-md rounded-2xl shadow-xl p-10 bg-[#1f1f1f]"
        >
          <h1 className="text-2xl font-bold text-center text-white">
            Crie sua conta
          </h1>

          {/* Nome */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#B69B4C]">Nome completo</label>
            <input
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="border border-gray-700 rounded-lg p-3 bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-[#B69B4C]"
            />
          </div>

          {/* Usuário */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#B69B4C]">Usuário</label>
            <input
              placeholder="Escolha um nome de usuário"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="border border-gray-700 rounded-lg p-3 bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-[#B69B4C]"
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#B69B4C]">Senha</label>
            <input
              placeholder="Crie uma senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-700 rounded-lg p-3 bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-[#B69B4C]"
            />
          </div>

          {/* Botão cadastrar */}
          <button
            type="submit"
            className="bg-[#B69B4C] text-black font-semibold py-3 rounded-lg shadow-md hover:bg-[#d4b865] transition"
          >
            Cadastrar
          </button>

          {msg && (
            <p className="text-center text-sm mt-2 text-gray-300">{msg}</p>
          )}

          {/* Divisor */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-600" />
            <span className="text-gray-400 text-sm">OU</span>
            <div className="flex-1 h-px bg-gray-600" />
          </div>

          {/* Já tem conta */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-300 text-sm">Já possui uma conta?</p>
            <Link
              href="/login"
              className="w-full border border-[#B69B4C] text-[#B69B4C] hover:bg-[#B69B4C] hover:text-black text-center px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Fazer login
            </Link>
          </div>
        </form>
      </main>

      <Footer showMap={false} />
    </>
  );
}
