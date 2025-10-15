"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/images/logo.svg";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { signOut } from "next-auth/react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, setUser, isAdmin } = useUser(); // agora pega isAdmin
  const { totalItems } = useCart();
  const [pedidosPendentes, setPedidosPendentes] = useState(0);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    
    // Atualizar a cada 2 minutos (reduzido de 30 segundos)
    const interval = setInterval(fetchPedidosPendentes, 120000);
    
    // Listener para evento customizado de atualização
    const handleRefresh = () => fetchPedidosPendentes();
    window.addEventListener('refreshPedidosCount', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshPedidosCount', handleRefresh);
    };
  }, [isAdmin]);

  // Fechar menu do usuário quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

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

  const handleLogout = async () => {
    if (isLoggingOut) return; // Previne múltiplos cliques
    
    setIsLoggingOut(true);
    
    try {
      // 1. Marcar logout manual IMEDIATAMENTE para evitar relogin automático
      localStorage.setItem("manual_logout", "true");
      localStorage.setItem("logout_timestamp", Date.now().toString());
      
      // 2. Limpar localStorage e estado do usuário
      localStorage.removeItem("usuario");
      setUser(null);
      
      // 3. Fazer logout do NextAuth (Google OAuth)
      await signOut({ 
        callbackUrl: "/",
        redirect: false // Não redirecionar automaticamente
      });
      
      console.log("Logout completo realizado");
    } catch (error) {
      console.error("Erro no logout:", error);
      // Mesmo com erro, limpar o estado local
      localStorage.setItem("manual_logout", "true");
      localStorage.setItem("logout_timestamp", Date.now().toString());
      localStorage.removeItem("usuario");
      setUser(null);
    } finally {
      // Reset do estado de loading após um pequeno delay
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    }
  };

  return (
    <header className="md:py-14 bg-white rounded-lg shadow-lg relative p-6 flex items-center justify-between font-bold text-sm">
      {/* Lado esquerdo - Mobile */}
      <div className="flex items-center">
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
      </div>

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

      {/* Lado direito - Desktop e Mobile */}
      <div className="flex items-center gap-4">
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
          </>
        )}

        {user ? (
          <div className="relative user-menu">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-gray-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menu Dropdown - Responsivo */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200 md:hidden">
                  <p className="font-bold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <Link
                  href="/perfil"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil
                </Link>
                
                <Link
                  href="/pedidos"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Pedidos
                </Link>
                
                <Link
                  href="/carrinho"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors relative"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  Carrinho
                  {totalItems > 0 && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
                
                <Link
                  href={isAdmin ? "/painel/mensagens" : "/chat"}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors relative"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Mensagem
                  {mensagensNaoLidas > 0 && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {mensagensNaoLidas}
                    </span>
                  )}
                </Link>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                <button
                  onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                  disabled={isLoggingOut}
                  className={`flex items-center gap-3 px-4 py-2 w-full text-left transition-colors ${
                    isLoggingOut 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {isLoggingOut ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="py-[0.6rem] px-5 rounded-lg font-bold bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)]"
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

        </nav>
      )}
    </header>
  );
}
