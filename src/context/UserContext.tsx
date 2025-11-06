"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef } from "react";

interface User {
  _id: string;
  login: string;
  name: string;
  permissao: string; // "administrador" ou "usuario"
  password: string;
  googleId?: string;
  email?: string;
  picture?: string;
  permissaoSuprema?: boolean | string; // Super Admin - pode promover outros a admin (aceita boolean ou string "true")
  ExIlimitada?: boolean | string; // Retrocompatibilidade (campo antigo)
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper para remover dados sensíveis antes de salvar no localStorage
const sanitizeUserForStorage = (user: User): Omit<User, 'password'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const lastValidationRef = useRef<number>(0);
  const isValidating = useRef(false);
  const lastUserLoginRef = useRef<string>("");
  const userStateRef = useRef<User | null>(null); // Ref para rastrear estado atual do usuário

  // Sincronizar ref com estado
  useEffect(() => {
    userStateRef.current = user;
  }, [user]);

  // Debug logs removido para produção

  // Recupera o usuário armazenado no localStorage e valida se ainda é válido no servidor
  useEffect(() => {
    // Evitar múltiplas validações simultâneas
    if (isValidating.current) {
      console.log("🔍 UserContext: Validação já em andamento, pulando");
      return;
    }
    
    const savedUser = localStorage.getItem("usuario");
    const manualLogout = localStorage.getItem("manual_logout");
    const logoutTimestamp = localStorage.getItem("logout_timestamp");

    // Logs apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 UserContext: Iniciando verificação de usuário");
      console.log("🔍 UserContext: savedUser existe:", !!savedUser);
      console.log("🔍 UserContext: manualLogout:", manualLogout);
    }
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log("🔍 UserContext: Usuário salvo:", {
          name: parsedUser.name,
          email: parsedUser.email,
          picture: parsedUser.picture,
          googleId: parsedUser.googleId
        });
        
        // Se o usuário é o mesmo que já foi validado recentemente, pular
        if (lastUserLoginRef.current === parsedUser.login) {
          const now = Date.now();
          const cacheTime = parsedUser.password === 'google-auth' ? 60000 : 30000;
          if (now - lastValidationRef.current < cacheTime) {
            console.log("🔍 UserContext: Mesmo usuário validado recentemente, pulando");
            if (!user) {
              setUser(parsedUser);
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("🔍 UserContext: Erro ao parsear usuário salvo:", e);
      }
    }

    // Se foi logout manual, não carregar usuário
    if (manualLogout === "true") {
      const timeSinceLogout = logoutTimestamp ? Date.now() - parseInt(logoutTimestamp) : 0;
      console.log("🚫 Logout manual detectado - não carregando usuário");
      console.log("🚫 Tempo desde logout:", timeSinceLogout);
      
      // Se já passou mais de 10 segundos, pode limpar a flag
      if (timeSinceLogout > 10000) {
        localStorage.removeItem("manual_logout");
        localStorage.removeItem("logout_timestamp");
        console.log("🧹 Flags de logout limpas");
      }
      
      setLoading(false);
      return;
    }

    if (!savedUser) {
      console.log("❌ Nenhum usuário salvo encontrado");
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(savedUser) as User;

    // Função para verificar o usuário no servidor
    const validateUser = async () => {
      // Marcar que validação está em andamento
      isValidating.current = true;
      
      // Atualizar registro de validação
      lastValidationRef.current = Date.now();
      lastUserLoginRef.current = parsedUser.login;
      
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 UserContext: Iniciando validação do usuário");
        console.log("🔍 UserContext: parsedUser:", {
          login: parsedUser.login,
          password: parsedUser.password?.substring(0, 10) + "...",
          googleId: parsedUser.googleId
        });
      }
      
      try {
        // Se é usuário Google, usar get-user-data com retry
        if (parsedUser.password === 'google-auth' && parsedUser.googleId) {
          console.log("🔍 UserContext: Validando usuário Google");
          
          let retryCount = 0;
          const maxRetries = 2;
          let success = false;
          
          while (retryCount < maxRetries && !success) {
            try {
              const res = await fetch("/api/auth/get-user-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ googleId: parsedUser.googleId }),
              });

              const data = await res.json();
              console.log("🔍 UserContext: Resposta get-user-data:", { ok: data.ok, hasUser: !!data.user, attempt: retryCount + 1 });

              if (data.ok && data.user) {
                // Usuário válido no servidor
                const validUser: User = {
                  _id: data.user._id,
                  login: data.user.login,
                  name: data.user.name,
                  permissao: data.user.permissao,
                  password: parsedUser.password,
                  email: data.user.email,
                  picture: data.user.picture,
                  googleId: data.user.googleId,
                };

                console.log("✅ UserContext: Usuário Google válido", {
                  name: validUser.name,
                  email: validUser.email,
                  picture: validUser.picture
                });
                setUser(validUser);
                localStorage.setItem("usuario", JSON.stringify(sanitizeUserForStorage(validUser)));
                success = true;
              } else if (retryCount < maxRetries - 1) {
                console.log(`🔄 UserContext: Tentativa ${retryCount + 1} falhou, tentando novamente...`);
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
              } else {
                // Usuário não válido após todas as tentativas, limpando localStorage
                console.log("❌ UserContext: Usuário Google inválido após todas as tentativas, limpando localStorage");
                localStorage.removeItem("usuario");
                setUser(null);
                success = true; // Para sair do loop
              }
            } catch (error) {
              console.error("❌ UserContext: Erro na validação Google:", error);
              if (retryCount < maxRetries - 1) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                console.log("❌ UserContext: Falha na validação após todas as tentativas");
                localStorage.removeItem("usuario");
                setUser(null);
                success = true;
              }
            }
          }
        } else {
          // Para usuários com senha tradicional, usar verificar-admin
          console.log("🔍 UserContext: Validando usuário tradicional");
          const res = await fetch("/api/verificar-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: parsedUser.login, password: parsedUser.password }),
          });

          const data = await res.json();
          console.log("🔍 UserContext: Resposta verificar-admin:", { ok: data.ok, hasUser: !!data.user });

          if (data.ok && data.user) {
            // Usuário válido no servidor
            const validUser: User = {
              _id: data.user._id,
              login: data.user.login,
              name: data.user.name,
              permissao: data.user.permissao,
              password: parsedUser.password, // Mantém a senha para futuras validações
              email: data.user.email,
              picture: data.user.picture,
            };

            console.log("✅ UserContext: Usuário tradicional válido", {
              name: validUser.name,
              email: validUser.email,
              picture: validUser.picture
            });
            setUser(validUser);
            localStorage.setItem("usuario", JSON.stringify(sanitizeUserForStorage(validUser)));
          } else {
            // Usuário não válido, limpando localStorage
            console.log("❌ UserContext: Usuário tradicional inválido, limpando localStorage");
            localStorage.removeItem("usuario");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("❌ UserContext: Erro ao verificar usuário:", error);
        
        // Se erro ocorrer, verifica se é erro de rede ou servidor
        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            console.log("⚠️ UserContext: Erro de rede - usando usuário do localStorage");
            setUser(parsedUser);
          } else {
            console.log("⚠️ UserContext: Erro de validação - limpando dados");
            localStorage.removeItem("usuario");
            setUser(null);
          }
        } else {
          console.log("⚠️ UserContext: Erro desconhecido - usando usuário do localStorage");
          setUser(parsedUser);
        }
      } finally {
        setLoading(false);
        isValidating.current = false;
        console.log("🔍 UserContext: Validação concluída, loading = false");
      }
    };

    validateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na montagem, dependências gerenciadas por refs
  
  // Sistema híbrido: Eventos + Polling de fallback
  useEffect(() => {
    console.log("🔄 UserContext: Iniciando sistema de sincronização OTIMIZADO");
    
    const checkLocalStorage = () => {
      const savedUser = localStorage.getItem("usuario");
      const manualLogout = localStorage.getItem("manual_logout");
      
      // Verificar logout manual
      if (manualLogout === "true") {
        const logoutTimestamp = localStorage.getItem("logout_timestamp");
        const timeSinceLogout = logoutTimestamp ? Date.now() - parseInt(logoutTimestamp, 10) : 0;
        
        if (timeSinceLogout < 10000) {
          // Logout recente - garantir que usuário está limpo
          if (userStateRef.current) {
            console.log("🔄 UserContext: Limpando usuário devido a logout manual");
            setUser(null);
          }
          return;
        }
      }
      
      // Se não há usuário salvo e temos usuário no contexto, limpar
      if (!savedUser && userStateRef.current) {
        console.log("🔄 UserContext: Logout detectado");
        setUser(null);
        return;
      }
      
      // Se há usuário salvo, verificar se precisa atualizar
      if (savedUser && !isValidating.current) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Verificar se o usuário mudou antes de atualizar (evitar re-renders desnecessários)
          const hasChanged = !userStateRef.current || 
                           userStateRef.current.login !== parsedUser.login ||
                           userStateRef.current.permissao !== parsedUser.permissao ||
                           userStateRef.current.permissaoSuprema !== parsedUser.permissaoSuprema ||
                           userStateRef.current.name !== parsedUser.name;
          
          if (hasChanged) {
            console.log("✅ UserContext: Atualizando usuário do localStorage:", parsedUser.name);
            setUser(parsedUser);
            setLoading(false);
          }
        } catch (e) {
          console.error("Erro ao parsear usuário do polling:", e);
        }
      }
    };

    // 1. Verificar imediatamente
    checkLocalStorage();
    
    // 2. Listener para evento direto com dados do usuário (MAIS RÁPIDO)
    const handleUserDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const newUser = customEvent.detail;
        
        // Verificar se o usuário realmente mudou antes de atualizar
        const hasChanged = !userStateRef.current || 
                         userStateRef.current.login !== newUser.login ||
                         userStateRef.current.permissao !== newUser.permissao ||
                         userStateRef.current.permissaoSuprema !== newUser.permissaoSuprema ||
                         userStateRef.current.name !== newUser.name;
        
        if (hasChanged) {
          console.log("🚀 UserContext: Dados do usuário recebidos DIRETAMENTE via evento!");
          setUser(newUser);
          setLoading(false);
        } else {
          console.log("✅ UserContext: Evento recebido mas usuário já está atualizado");
        }
      }
    };
    
    // 3. Listener para eventos genéricos
    const handleStorageUpdate = (event?: Event) => {
      console.log("🔔 UserContext: Evento de atualização recebido:", event?.type);
      checkLocalStorage();
    };
    
    const handleUserLoggedIn = () => {
      console.log("🔔 UserContext: Evento userLoggedIn recebido!");
      checkLocalStorage();
    };
    
    // Registrar listeners (userDataUpdated TEM PRIORIDADE)
    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    window.addEventListener('localStorageUpdated', handleStorageUpdate);
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    window.addEventListener('userLoggedOut', handleStorageUpdate);
    
    // 4. Polling de fallback a cada 2 segundos (otimizado - 300ms era muito agressivo)
    const interval = setInterval(checkLocalStorage, 2000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
      window.removeEventListener('localStorageUpdated', handleStorageUpdate);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('userLoggedOut', handleStorageUpdate);
    };
  }, []); // NUNCA reexecuta - listeners ficam sempre ativos

  // Verifica se o usuário tem permissão de administrador usando useMemo para performance
  const isAdmin = useMemo(() => {
    return user?.permissao === "administrador";
  }, [user]);

  // Verifica se o usuário tem permissão suprema (Super Admin)
  // Aceita tanto boolean true quanto string "true" do MongoDB
  // Suporta ambos os campos: permissaoSuprema (novo) e ExIlimitada (antigo)
  const isSuperAdmin = useMemo(() => {
    const permissaoSuprema = user?.permissaoSuprema === true || user?.permissaoSuprema === "true";
    const exIlimitada = user?.ExIlimitada === true || user?.ExIlimitada === "true";
    return permissaoSuprema || exIlimitada;
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, isSuperAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook para acessar o contexto de usuário
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser deve ser usado dentro de UserProvider");
  return context;
};
