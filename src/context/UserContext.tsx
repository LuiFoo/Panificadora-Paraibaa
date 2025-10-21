"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef } from "react";

interface User {
  _id: string;
  login: string;
  name: string;
  permissao: string; // "administrador" ou outro
  password: string;
  googleId?: string;
  email?: string;
  picture?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper para remover dados sensíveis antes de salvar no localStorage
const sanitizeUserForStorage = (user: User): Omit<User, 'password'> => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const lastValidationRef = useRef<number>(0);
  const isValidating = useRef(false);
  const lastUserLoginRef = useRef<string>("");

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
  }, []); // Executa apenas uma vez na montagem
  
  // Polling unificado para detectar mudanças no localStorage
  useEffect(() => {
    console.log("🔄 UserContext: Iniciando polling unificado");
    
    const checkLocalStorage = () => {
      const savedUser = localStorage.getItem("usuario");
      const manualLogout = localStorage.getItem("manual_logout");
      
      // Verificar logout manual
      if (manualLogout === "true") {
        const logoutTimestamp = localStorage.getItem("logout_timestamp");
        const timeSinceLogout = logoutTimestamp ? Date.now() - parseInt(logoutTimestamp, 10) : 0;
        
        if (timeSinceLogout < 10000) {
          // Logout recente - garantir que usuário está limpo
          if (user) {
            console.log("🔄 UserContext: Limpando usuário devido a logout manual");
            setUser(null);
          }
          return;
        }
      }
      
      // Se não há usuário salvo e temos usuário no contexto, limpar
      if (!savedUser && user) {
        console.log("🔄 UserContext: Logout detectado");
        setUser(null);
        return;
      }
      
      // Se há usuário salvo mas não no contexto, carregar
      if (savedUser && !user && !isValidating.current) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log("✅ UserContext: Usuário detectado no localStorage:", parsedUser.name);
          setUser(parsedUser);
          setLoading(false);
        } catch (e) {
          console.error("Erro ao parsear usuário do polling:", e);
        }
      }
    };

    // Verificar imediatamente
    checkLocalStorage();
    
    // Polling a cada 500ms (apenas um interval)
    const interval = setInterval(checkLocalStorage, 500);
    
    return () => {
      clearInterval(interval);
    };
  }, [user]); // Reexecuta quando user muda

  // Verifica se o usuário tem permissão de administrador usando useMemo para performance
  const isAdmin = useMemo(() => {
    return user?.permissao === "administrador";
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, loading }}>
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
