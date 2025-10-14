"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/images/logo.svg";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, setUser, isAdmin } = useUser(); // agora pega isAdmin
  const { totalItems } = useCart();
  const [pedidosPendentes, setPedidosPendentes] = useState(0);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

  // Buscar quantidade de pedidos pendentes (apenas para admins)
  useEffect(() => {
    const fetchPedidosPendentes = async () => {
      if (!isAdmin) return;
      
      try {
        const response = await fetch("/api/admin/pedidos");
        const data = await response.json();
        if (data.pedidos) {
          const pendentes = data.pedidos.filter(
            (p: { status: string }) => p.status === "pendente"
          ).length;
          setPedidosPendentes(pendentes);
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos pendentes:", error);
      }
    };

    fetchPedidosPendentes();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPedidosPendentes, 30000);
    
    // Listener para evento customizado de atualização
    const handleRefresh = () => fetchPedidosPendentes();
    window.addEventListener('refreshPedidosCount', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshPedidosCount', handleRefresh);
    };
  }, [isAdmin]);

  // Buscar quantidade de mensagens não lidas
  useEffect(() => {
    const fetchMensagensNaoLidas = async () => {
      if (!user) return;
      
      try {
        if (isAdmin) {
          // Admin vê mensagens não respondidas dos clientes
          const response = await fetch("/api/mensagens?isAdmin=true");
          const data = await response.json();
          if (data.success) {
            const total = data.conversas.reduce(
              (sum: number, c: { naoLidas: number }) => sum + c.naoLidas,
              0
            );
            setMensagensNaoLidas(total);
          }
        } else {
          // Cliente vê mensagens não lidas do admin
          const response = await fetch(`/api/mensagens?userId=${user.login}`);
          const data = await response.json();
          if (data.success) {
            const naoLidas = data.mensagens.filter(
              (m: { lida: boolean; remetente: string }) => !m.lida && m.remetente === "admin"
            ).length;
            setMensagensNaoLidas(naoLidas);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar mensagens não lidas:", error);
      }
    };

    fetchMensagensNaoLidas();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchMensagensNaoLidas, 10000);
    
    // Listener para evento customizado de atualização
    const handleRefresh = () => fetchMensagensNaoLidas();
    window.addEventListener('refreshMensagensCount', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshMensagensCount', handleRefresh);
    };
  }, [user, isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUser(null);
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

      {/* Área de ações */}
      <div className="ms-auto flex items-center gap-4">
        {user && (
          <>
            {/* Ícone do painel só para administradores */}
            {isAdmin && (
              <Link href="/painel" className="hidden md:block relative">
                <Image
                  src="/images/admin.svg"
                  alt="Painel Admin"
                  width={24}
                  height={24}
                  className="hover:opacity-80 transition"
                />
                {pedidosPendentes > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                    {pedidosPendentes}
                  </span>
                )}
              </Link>
            )}

            {/* Ícone de Mensagens */}
            <Link 
              href={isAdmin ? "/painel/mensagens" : "/chat"} 
              className="hidden md:block relative"
            >
              <Image
                src="/images/icone_chat.svg"
                alt="Chat"
                width={24}
                height={24}
                className="hover:opacity-80 transition"
              />
              {mensagensNaoLidas > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {mensagensNaoLidas}
                </span>
              )}
            </Link>

            {/* Ícone do carrinho */}
            <Link href="/carrinho" className="hidden md:block relative">
              <Image
                src="/images/market.svg"
                alt="Carrinho"
                width={24}
                height={24}
                className="hover:opacity-80 transition"
              />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>
          </>
        )}

        {user ? (
          <button
            onClick={handleLogout}
            className="py-[0.6rem] px-5 rounded-lg font-bold bg-red-500 hover:bg-red-600 hidden md:block"
          >
            Sair
          </button>
        ) : (
          <Link
            href="/login"
            className="py-[0.6rem] px-5 rounded-lg font-bold bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] hidden md:block"
          >
            Entre / Cadastre-se
          </Link>
        )}
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <nav className="absolute top-full left-0 w-full bg-white shadow-md flex flex-col items-center gap-4 py-6 font-bold text-sm z-50 md:hidden">
          <Link href="/" onClick={() => setMenuOpen(false)}>PÁGINA INICIAL</Link>
          <Link href="/quem-somos" onClick={() => setMenuOpen(false)}>QUEM SOMOS</Link>
          <Link href="/produtos" onClick={() => setMenuOpen(false)}>PRODUTOS</Link>
          <Link href="/fale-conosco" onClick={() => setMenuOpen(false)}>FALE CONOSCO</Link>

          {isAdmin && (
            <Link href="/painel" onClick={() => setMenuOpen(false)} className="text-blue-600 relative font-bold">
              PAINEL ADMIN
              {pedidosPendentes > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {pedidosPendentes}
                </span>
              )}
            </Link>
          )}

          {user && (
            <Link 
              href={isAdmin ? "/painel/mensagens" : "/chat"} 
              onClick={() => setMenuOpen(false)} 
              className="text-blue-500 font-bold relative"
            >
              MENSAGENS
              {mensagensNaoLidas > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {mensagensNaoLidas}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <>
              <Link href="/carrinho" onClick={() => setMenuOpen(false)} className="relative font-bold text-red-500">
                CARRINHO
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="font-bold text-red-500"
              >
                SAIR
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="font-bold text-green-600"
            >
              Entre / Cadastre-se
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
