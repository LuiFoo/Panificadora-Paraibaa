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
  const { user, setUser, isAdmin, loading } = useUser(); // agora pega isAdmin e loading
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
    
    // Polling inteligente - só quando a página está visível
    const intervalRef = { current: null as NodeJS.Timeout | null };
    
    const startPolling = () => {
      // Limpar interval anterior se existir
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(fetchPedidosPendentes, 120000);
    };
    
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Página ficou visível, buscar pedidos imediatamente
        fetchPedidosPendentes();
        // Reiniciar polling
        startPolling();
      }
    };
    
    // Iniciar polling se página estiver visível
    if (!document.hidden) {
      startPolling();
    }
    
    // Escutar mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listener para evento customizado de atualização
    const handleRefresh = () => fetchPedidosPendentes();
    window.addEventListener('refreshPedidosCount', handleRefresh);
    
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    
    // Polling inteligente - só quando a página está visível
    const intervalRef = { current: null as NodeJS.Timeout | null };
    
    const startPolling = () => {
      // Limpar interval anterior se existir
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(fetchMensagensNaoLidas, 15000);
    };
    
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Página ficou visível, buscar mensagens imediatamente
        fetchMensagensNaoLidas();
        // Reiniciar polling
        startPolling();
      }
    };
    
    // Iniciar polling se página estiver visível
    if (!document.hidden) {
      startPolling();
    }
    
    // Escutar mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listener para evento customizado de atualização
    const handleRefresh = () => fetchMensagensNaoLidas();
    window.addEventListener('refreshMensagensCount', handleRefresh);
    
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      
      // Disparar eventos de logout para sincronização imediata
      window.dispatchEvent(new Event('localStorageUpdated'));
      window.dispatchEvent(new Event('userLoggedOut'));
      
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
      
      // Disparar eventos de logout para sincronização imediata
      window.dispatchEvent(new Event('localStorageUpdated'));
      window.dispatchEvent(new Event('userLoggedOut'));
      
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
      <div className="flex items-center gap-4 min-h-[40px]">
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

        {loading ? (
          <div className="flex items-center gap-2 p-1 md:p-2 h-10 transition-all duration-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <span className="text-sm text-gray-600 hidden md:block">Carregando...</span>
          </div>
        ) : user ? (
          <div className="relative user-menu">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 md:p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 h-10 relative"
            >
              <div className="relative">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-gray-300"
                    onError={(e) => {
                      console.log("Erro ao carregar foto do header:", user.picture);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log("Foto do header carregada:", user.picture);
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {/* Badge do carrinho na foto de perfil */}
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg">
                    {totalItems}
                  </span>
                )}
              </div>
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
                  <Image
                    src="/images/icons/icone_perfil.svg"
                    alt="Perfil"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  Perfil
                </Link>
                
                <Link
                  href="/meus-pedidos"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Image
                    src="/images/icons/icone_pedidos.svg"
                    alt="Pedidos"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  Pedidos
                </Link>
                
                <Link
                  href="/carrinho"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors relative"
                >
                  <Image
                    src="/images/icons/icone_carrinho.svg"
                    alt="Carrinho"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
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
                  <Image
                    src="/images/icons/icone_chat.svg"
                    alt="Mensagem"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
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
                  <Image
                    src="/images/icons/icone_sair.svg"
                    alt="Sair"
                    width={16}
                    height={16}
                    className={`w-4 h-4 ${
                      isLoggingOut 
                        ? 'opacity-50' 
                        : ''
                    }`}
                  />
                  {isLoggingOut ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="py-[0.6rem] px-5 rounded-lg font-bold bg-[var(--color-avocado-600)] hover:bg-[var(--color-avocado-500)] h-10 flex items-center transition-all duration-300"
          >
            Entrar com Google
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
