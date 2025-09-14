"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/images/logo.svg";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState<{ name: string; login: string } | null>(null);

  // Busca usuário no localStorage ao carregar o Header
  useEffect(() => {
    const savedUser = localStorage.getItem("usuario");
    if (savedUser) {
      setUsuario(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  return (
    <header className="md:py-14 bg-white rounded-lg shadow-lg relative p-6 flex items-center font-bold text-sm">
      {/* Botão menu (mobile) */}
      <button
        className="block md:hidden z-20"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Abrir menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Menu Desktop */}
      <nav className="py-14 hidden md:flex justify-center items-center gap-5 absolute left-1/2 -translate-x-1/2">
        <Link href="/">PÁGINA INICIAL</Link>
        <Link href="/quem-somos">QUEM SOMOS</Link>
        <Link href="/">
          <Image src={logo} alt="Logo" width={121} height={79} />
        </Link>
        <Link href="/produtos">PRODUTOS</Link>
        <Link href="/fale-conosco">FALE CONOSCO</Link>
      </nav>

      {/* Entre/Cadastre-se ou Sair */}
      {usuario ? (
        <button
          onClick={handleLogout}
          className="py-[0.6rem] px-5 rounded-lg font-bold bg-red-500 hover:bg-red-600 hidden md:block ms-auto mx-10"
        >
          Sair
        </button>
      ) : (
        <Link
          href="/login"
          className="py-[0.6rem] px-5 rounded-lg font-bold bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] hidden md:block ms-auto mx-10"
        >
          Entre / Cadastre-se
        </Link>
      )}

      {/* Menu Mobile */}
      {menuOpen && (
        <nav className="absolute top-full left-0 w-full bg-white shadow-md flex flex-col items-center gap-4 py-6 font-bold text-sm z-50 md:hidden">
          <Link href="/" onClick={() => setMenuOpen(false)}>PÁGINA INICIAL</Link>
          <Link href="/quem-somos" onClick={() => setMenuOpen(false)}>QUEM SOMOS</Link>
          <Link href="/produtos" onClick={() => setMenuOpen(false)}>PRODUTOS</Link>
          <Link href="/fale-conosco" onClick={() => setMenuOpen(false)}>FALE CONOSCO</Link>
          {usuario ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="font-bold text-red-500">
              Sair
            </button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="font-bold text-green-600">
              Entre / Cadastre-se
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
