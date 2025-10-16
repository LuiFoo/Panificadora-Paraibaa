"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";

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

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Debug logs removidos para produção

  // Recupera o usuário armazenado no localStorage e valida se ainda é válido no servidor
  useEffect(() => {
    console.log("🔍 UserContext: Iniciando verificação de usuário");
    const savedUser = localStorage.getItem("usuario");
    const manualLogout = localStorage.getItem("manual_logout");
    const logoutTimestamp = localStorage.getItem("logout_timestamp");

    console.log("🔍 UserContext: savedUser existe:", !!savedUser);
    console.log("🔍 UserContext: manualLogout:", manualLogout);
    console.log("🔍 UserContext: logoutTimestamp:", logoutTimestamp);
    
    // Se já temos um usuário no contexto, não precisa recarregar do localStorage
    if (user) {
      console.log("🔍 UserContext: Usuário já existe no contexto, pulando verificação");
      setLoading(false);
      return;
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
      console.log("🔍 UserContext: Iniciando validação do usuário");
      console.log("🔍 UserContext: parsedUser:", {
        login: parsedUser.login,
        password: parsedUser.password?.substring(0, 10) + "...",
        googleId: parsedUser.googleId
      });
      
      try {
        // Se é usuário Google, usar get-user-data
        if (parsedUser.password === 'google-auth' && parsedUser.googleId) {
          console.log("🔍 UserContext: Validando usuário Google");
          const res = await fetch("/api/auth/get-user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ googleId: parsedUser.googleId }),
          });

          const data = await res.json();
          console.log("🔍 UserContext: Resposta get-user-data:", { ok: data.ok, hasUser: !!data.user });

          if (data.ok && data.user) {
            // Usuário válido no servidor
            const validUser: User = {
              _id: data.user._id,
              login: data.user.login,
              name: data.user.name,
              permissao: data.user.permissao,
              password: parsedUser.password,
            };

            console.log("✅ UserContext: Usuário Google válido");
            setUser(validUser);
            localStorage.setItem("usuario", JSON.stringify(validUser));
          } else {
            // Usuário não válido, limpando localStorage
            console.log("❌ UserContext: Usuário Google inválido, limpando localStorage");
            localStorage.removeItem("usuario");
            setUser(null);
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
            };

            console.log("✅ UserContext: Usuário tradicional válido");
            setUser(validUser);
            localStorage.setItem("usuario", JSON.stringify(validUser));
          } else {
            // Usuário não válido, limpando localStorage
            console.log("❌ UserContext: Usuário tradicional inválido, limpando localStorage");
            localStorage.removeItem("usuario");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("❌ UserContext: Erro ao verificar usuário:", error);
        // Se erro ocorrer, mantém o usuário no localStorage temporariamente
        setUser(parsedUser);
      } finally {
        setLoading(false);
        console.log("🔍 UserContext: Validação concluída, loading = false");
      }
    };

    validateUser();
  }, [user]); // Executa quando user muda

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
